// whatson.js

const BASE = new URL('..', import.meta.url).href;
const DEFAULT_NO_TEACHING_WEEKS = [9, 10, 11, 12, 13, 14];
const DEFAULT_WEEK0_TODO = ["Download BOTH assessment tasks 💾", "Make a plan to complete them 🗓️"];

// Days to add to a week's date for holiday breaks.
// breaks: array of { afterWeek, weeks } for this unit and trimester, or undefined.
// When undefined, keep the legacy rule: T3 adds 14 days from Week 9.
function breakOffsetDays(week, trimester, breaks) {
  if (Array.isArray(breaks)) {
    return breaks.reduce((days, b) => (week > b.afterWeek ? days + b.weeks * 7 : days), 0);
  }
  return trimester === "T3" && week >= 9 ? 14 : 0;
}

function getDateList(startDate, trimester, breaks) {
  let dateList = [];
  const week0 = new Date(startDate);
  week0.setDate(week0.getDate() - 7);
  week0.setHours(0, 0, 0, 0);
  dateList.push({ week: 0, date: week0 });

  dateList.push({ week: 1, date: startDate });

  let currentWeek = 2;
  while (currentWeek <= 14) {
    let thisDate = new Date(week0);
    thisDate.setDate(week0.getDate() + currentWeek * 7);

    thisDate.setDate(thisDate.getDate() + breakOffsetDays(currentWeek, trimester, breaks));
    dateList.push({ week: currentWeek, date: thisDate });
    currentWeek += 1;
  }
  return dateList;
}

function getCurrentWeek(forToday, fromDateList) {
  const dates = fromDateList.map((item) => item.date);

  if (forToday < dates[0]) return 0;

  for (let i = 0; i < dates.length; i++) {
    const fromDate = dates[i];
    const toDate = dates[i + 1];

    if (!toDate) return fromDateList[fromDateList.length - 1].week;

    // inclusive lower bound, exclusive upper bound
    if (forToday >= fromDate && forToday < toDate) {
      // IMPORTANT: return actual week number, not index
      return fromDateList[i].week;
    }
  }
  return 0;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function portalLink(unitCfg) {
  if (!unitCfg.assessmentPortalUrl) return 'the Assessment Portal';
  return `<a href="${escapeHtml(unitCfg.assessmentPortalUrl)}" target="_blank" rel="noopener noreferrer">Assessment Portal</a>`;
}

function linkHtml(url, label) {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function ulHtml(items) {
  if (!items || items.length === 0) return "";
  return `<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>`;
}

function formatDateAU(d) {
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ul(items) {
  if (!items || items.length === 0) return "";
  return `<ul>${items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
}

function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function collectAllAssessments(unitCfg) {
  const out = [];
  const seen = new Set();
  for (const wk of Object.values(unitCfg.weeks)) {
    if (!wk.assessments) continue;
    for (const a of wk.assessments) {
      const key = `${a.name}::${a.due}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a);
    }
  }
  return out;
}

function buildAssessmentReminders(unitCfg, today) {
  const all = collectAllAssessments(unitCfg);
  if (all.length === 0) return "";

  const lines = [];

  for (const a of all) {
    const due = new Date(a.due);
    due.setHours(0, 0, 0, 0);

    const dd = daysBetween(today, due);

    // Optional a.url links the task name and replaces the portal pointer.
    const name = a.url ? linkHtml(a.url, a.name) : escapeHtml(a.name);
    const see = a.url ? "" : ` (see ${portalLink(unitCfg)})`;

    // Optional a.closes: an automatic extension runs from the due date until submissions close.
    if (a.closes && dd < 0) {
      const closes = new Date(a.closes);
      closes.setHours(0, 0, 0, 0);
      const dc = daysBetween(today, closes);
      if (dc === 0) {
        lines.push(`❗ <strong>${name}</strong>: the extension ends <strong>today</strong>, when submissions close.`);
      } else if (dc > 0) {
        lines.push(`⏳ <strong>${name}</strong> was due ${Math.abs(dd)} day${Math.abs(dd) === 1 ? "" : "s"} ago. Automatic extension until ${escapeHtml(formatDateAU(closes))}, when submissions close.`);
      }
      continue;
    }

    if (dd === 0) {
      lines.push(`⚠️ <strong>${name}</strong> is due <strong>today</strong>${see}.`);
    } else if (dd > 0 && dd <= 7) {
      lines.push(`⚠️ <strong>${name}</strong> is due in <strong>${dd} day${dd === 1 ? "" : "s"}</strong>${see}.`);
    } else if (dd > 7 && dd <= 14) {
      lines.push(`⏳ ${name} is approaching (due ${escapeHtml(formatDateAU(due))}).`);
    } else if (dd < 0 && dd >= -14) {
      lines.push(`❗ <strong>${name}</strong> was due ${Math.abs(dd)} day${Math.abs(dd) === 1 ? "" : "s"} ago${see}.`);
    }
  }

  if (lines.length === 0) return "";
  return `<div><strong>Assessment reminders</strong></div>${ulHtml(lines)}`;
}

export async function displayWhatsOn({
  forUnit,
  forStartDate: theStartDate,
  forTri: trimester,
  forDate, // test-only override for "today" (ISO date); production shells omit it
}) {
  if (!forUnit) {
    console.error("whatson: forUnit is required");
    document.getElementById("heading").innerHTML = "Content unavailable — unit not specified.";
    document.getElementById("details").innerHTML = "";
    return;
  }

  const unitKey = String(forUnit).toUpperCase();

  let unitCfg;
  try {
    const res = await fetch(`${BASE}config/units/${unitKey}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    unitCfg = await res.json();
  } catch (e) {
    console.error(`whatson: could not load config for ${unitKey}:`, e);
    document.getElementById("heading").innerHTML = "Content unavailable — please refresh the page.";
    document.getElementById("details").innerHTML = "";
    return;
  }

  const classStartDate = new Date(theStartDate);
  classStartDate.setHours(0, 0, 0, 0);

  const today = forDate ? new Date(forDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const triKey = `${trimester}-${classStartDate.getFullYear()}`;
  const dateList = getDateList(classStartDate, trimester, unitCfg.breaks?.[triKey]);
  const thisWeek = getCurrentWeek(today, dateList);
  const noTeachingWeeks = new Set(unitCfg.noTeachingWeeks ?? DEFAULT_NO_TEACHING_WEEKS);
  const itemLabel = unitCfg.itemLabel ?? "topic";

  // Heading includes commencing date (from the date list, so breaks are respected)
  const commencing = dateList.find((d) => d.week === thisWeek)?.date ?? classStartDate;

  let heading =
    thisWeek === 0
      ? `${escapeHtml(unitKey)}: Zero Week (trimester starts ${escapeHtml(formatDateAU(classStartDate))})`
      : `Week ${thisWeek} (commencing ${escapeHtml(formatDateAU(commencing))})`;

  // Build message details
  let parts = [];

  if (thisWeek === 0) {
    // week0Message is a string in JSON; handle string or legacy array gracefully
    const msgs = Array.isArray(unitCfg.week0Message)
      ? unitCfg.week0Message.filter(Boolean)
      : [unitCfg.week0Message].filter(Boolean);
    msgs.forEach(m => parts.push(`<p>${escapeHtml(m)}</p>`));
    parts.push(`<div><strong>To do</strong></div>`);
    parts.push(ul(unitCfg.week0Todo ?? DEFAULT_WEEK0_TODO));
    parts.push(`<p>Quick link: ${portalLink(unitCfg)}</p>`);
  } else if (thisWeek > 14) {
    heading = `${escapeHtml(unitKey)}: Teaching has ended for this period`;
    parts.push(`Please refer to the ${portalLink(unitCfg)} and unit announcements for final submission requirements and updates.`);
  } else {
    // JSON week keys are strings
    const info = unitCfg.weeks[String(thisWeek)] || {
      item: `${itemLabel} ${thisWeek}`,
      title: "Check the module/topic tiles below for this week's materials.",
    };

    // Module vs Topic wording will come from schedule values already (Module 1 / Topic 1)
    parts.push(`<div><strong>${escapeHtml(info.item)}</strong></div>`);
    parts.push(`<div>${escapeHtml(info.title)}</div>`);

    // Teaching vs no teaching
    if (noTeachingWeeks.has(thisWeek) || info.teaching === false) {
      if (unitCfg.noTeachingMessage) {
        parts.push(`<p>${escapeHtml(unitCfg.noTeachingMessage)}</p>`);
      } else {
        parts.push(
          `<p>There is no teaching this week, and no lecture will be posted. Please use this time for Professional Experience (where applicable) and to stay on top of assessment requirements. Check the ${portalLink(
            unitCfg
          )} and unit announcements for any updates.</p>`
        );
      }
    } else {
      parts.push(
        `<p>Learning materials for this week are available in the ${escapeHtml(
          itemLabel.toLowerCase()
        )} tiles below. Please check the ${portalLink(
          unitCfg
        )} for full task instructions and submission details.</p>`
      );
    }

    // Activities: optional [{ label, url }] for this week, shown as links
    if (info.activities && info.activities.length) {
      parts.push(`<div><strong>Activities</strong></div>`);
      parts.push(ulHtml(info.activities.map((x) => (x.url ? linkHtml(x.url, x.label) : escapeHtml(x.label)))));
    }

    // Notes
    if (info.notes && info.notes.length) {
      parts.push(`<div><strong>Notes</strong></div>`);
      parts.push(ul(info.notes));
    }

    // Assessment reminders (unit-wide)
    const reminderHtml = buildAssessmentReminders(unitCfg, today);
    if (reminderHtml) parts.push(reminderHtml);

    // Live sessions block only during teaching weeks
    if (!(noTeachingWeeks.has(thisWeek) || info.teaching === false)) {
      const liveWhen = [unitCfg.liveDay, unitCfg.liveTime].filter(Boolean).map(escapeHtml).join(" ");
      parts.push(
        `<div><strong>Live session${liveWhen ? ` (${liveWhen})` : ""}</strong></div>`
      );
      parts.push(`<div>${info.live ? escapeHtml(info.live) : "See the Live Sessions details below."}</div>`);
    }
  }

  document.getElementById("heading").innerHTML = heading;
  document.getElementById("details").innerHTML = parts.filter(Boolean).join("\n");
}
