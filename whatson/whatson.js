class Events {
  // Unit-specific configuration + schedule data
  static units = {
    EDSE357: {
      itemLabel: "Topic",
      liveDay: "Wednesday",
      liveTime: "5:30–6:30pm",
      assessmentPortalUrl: "https://mylearn.une.edu.au/course/section.php?id=477930",
      // week -> info
      weeks: {
        1: { item: "Topic 1", title: "Introduction to the Stage 6 science syllabuses", live: "🎤 Live Session" },
        2: { item: "Topic 2", title: "Conducting Investigations", live: "🎤 Live Session: Topic 1 & 2" },
        3: { item: "Topic 3", title: "Open-ended Investigations", live: "🎤 Live Session" },
        4: { item: "Topic 4", title: "Research and Experimentation", live: "🎤 Live Session: Topic 3 & 4" },
        5: { item: "Topic 5", title: "Selecting and Evaluating Resources", live: "🎤 Live Session", notes: ["Census Day occurs this week."] },
        6: {
          item: "Topic 6",
          title: "Current and Future Uses and Applications of Science",
          live: "🎤 Live Session: Topic 5 & 6",
          assessments: [{ name: "Assessment Task 1", due: "2026-03-29" }],
        },
        7: { item: "Topic 7", title: "Audit your senior science content knowledge", live: "🎤 Live Session" },
        8: { item: "Topic 8", title: "Teaching with a diverse cohort", live: "🎤 Live Session: Topic 7 & 8" },
        9: { item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        10: {
          item: "Professional Experience",
          title: "Flexible Window for Professional Experience (School of Education Only)",
          assessments: [{ name: "Assessment Task 2", due: "2026-05-03" }],
        },
        11: { item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        12: { item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        13: { item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        14: { item: "Assessment period", title: "Assessment and Intensive Period 2" },
      },
      week0Message: [
        "Have a look around at the first few tiles below — we’ll get started next week!",
      ],
    },

    EDSE358: {
      itemLabel: "Module",
      liveDay: "Thursday",
      liveTime: "5:30–6:30pm",
      assessmentPortalUrl: "https://mylearn.une.edu.au/course/section.php?id=477943",
      weeks: {
        1: {
          item: "Module 1",
          title: "The Senior Science Syllabus",
          live: "LIVE SESSION 1",
          notes: ["Download BOTH assessment tasks 💾", "Make a plan to complete them 🗓️"],
        },
        2: { item: "Module 2", title: "The Nature of Science Teaching", live: "🎤 LIVE SESSION 2: MODULE 1&2" },
        3: { item: "Module 3A", title: "Planning and Assessing Learning Models and Constructivist Teaching", live: "🎤 LIVE SESSION 3" },
        4: {
          item: "Module 3B",
          title: "Planning and Assessing Programs and Lesson Plans",
          live: "🎤 LIVE SESSION 4: MODULE 3",
          assessments: [{ name: "Assessment Task 1 — Part A (5%)", due: "2026-03-22" }],
        },
        5: { item: "Module 4A", title: "Assessing and Reporting — Assessment for learning", live: "🎤 LIVE SESSION 5", notes: ["Census Day occurs this week."] },
        6: {
          item: "Module 4B",
          title: "Assessing and Reporting — Designing assessment instruments",
          live: "🎤 LIVE SESSION 6: MODULE 4A&B",
          assessments: [{ name: "Assessment Task 1 — Parts B, C & D (55%)", due: "2026-04-05" }],
        },
        7: { item: "Module 4C", title: "Assessing and Reporting — Designing differentiated assessment", live: "🎤 LIVE SESSION 7" },
        8: { item: "Module 4D", title: "Assessing and Reporting — Developing rubrics and providing feedback", live: "🎤 LIVE SESSION 8: MODULE 4C&D" },
        9: { item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        10:{ item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        11:{
          item: "Professional Experience",
          title: "Flexible Window for Professional Experience (School of Education Only)",
          assessments: [{ name: "EDSE358 Assessment 2 (40%)", due: "2026-05-04" }],
        },
        12:{ item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        13:{ item: "Professional Experience", title: "Flexible Window for Professional Experience (School of Education Only)" },
        14:{ item: "Assessment period", title: "Assessment and Intensive Period 2" },
      },
      week0Message: [
        "Have a look around at the first few tiles below and finish up the Week 0 section — we’ll get started next week!",
      ],
    },
  };

  static noTeachingWeeks = new Set([9, 10, 11, 12, 13, 14]);
}

function getDateList(startDate, trimester) {
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

    if (trimester === "T3" && currentWeek >= 9) {
      thisDate.setDate(thisDate.getDate() + 14);
    }
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
  return `<a href="${escapeHtml(unitCfg.assessmentPortalUrl)}" target="_blank" rel="noopener noreferrer">Assessment Portal</a>`;
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

    if (dd === 0) {
      lines.push(`⚠️ <strong>${escapeHtml(a.name)}</strong> is due <strong>today</strong> (see ${portalLink(unitCfg)}).`);
    } else if (dd > 0 && dd <= 7) {
      lines.push(`⚠️ <strong>${escapeHtml(a.name)}</strong> is due in <strong>${dd} day${dd === 1 ? "" : "s"}</strong> (see ${portalLink(unitCfg)}).`);
    } else if (dd > 7 && dd <= 14) {
      lines.push(`⏳ ${escapeHtml(a.name)} is approaching (due ${escapeHtml(formatDateAU(due))}).`);
    } else if (dd < 0 && dd >= -14) {
      lines.push(`❗ <strong>${escapeHtml(a.name)}</strong> was due ${Math.abs(dd)} day${Math.abs(dd) === 1 ? "" : "s"} ago (see ${portalLink(unitCfg)}).`);
    }
  }

  if (lines.length === 0) return "";
  return `<div><strong>Assessment reminders</strong></div>${ulHtml(lines)}`;
}

export function displayWhatsOn({
  forUnit = "EDSE358",
  forStartDate: theStartDate,
  forTri: trimester,
}) {
  const unitKey = String(forUnit).toUpperCase();
  const unitCfg = Events.units[unitKey] || Events.units.EDSE358;

  const classStartDate = new Date(theStartDate);
  classStartDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateList = getDateList(classStartDate, trimester);
  const thisWeek = getCurrentWeek(today, dateList);

  // Heading includes commencing date
  const commencing = new Date(classStartDate);
  if (thisWeek >= 1) commencing.setDate(commencing.getDate() + (thisWeek - 1) * 7);

  let heading =
    thisWeek === 0
      ? `${escapeHtml(unitKey)}: Zero Week (trimester starts ${escapeHtml(formatDateAU(classStartDate))})`
      : `Week ${thisWeek} (commencing ${escapeHtml(formatDateAU(commencing))})`;

  // Build message details
  let parts = [];

  if (thisWeek === 0) {
    parts.push(`<p>${escapeHtml(unitCfg.week0Message[0])}</p>`);
    parts.push(`<p>${escapeHtml(unitCfg.week0Message[1])}</p>`);
    parts.push(`<div><strong>To do</strong></div>`);
    parts.push(ul(["Download BOTH assessment tasks 💾", "Make a plan to complete them 🗓️"]));
    parts.push(`<p>Quick link: ${portalLink(unitCfg)}</p>`);
  } else if (thisWeek > 14) {
    heading = `${escapeHtml(unitKey)}: Teaching has ended for this period`;
    parts.push(`Please refer to the ${portalLink(unitCfg)} and unit announcements for final submission requirements and updates.`);
  } else {
    const info = unitCfg.weeks[thisWeek] || {
      item: `${unitCfg.itemLabel} ${thisWeek}`,
      title: "Check the module/topic tiles below for this week’s materials.",
    };

    // Module vs Topic wording will come from schedule values already (Module 1 / Topic 1)
    parts.push(`<div><strong>${escapeHtml(info.item)}</strong></div>`);
    parts.push(`<div>${escapeHtml(info.title)}</div>`);

    // Teaching vs no teaching
    if (Events.noTeachingWeeks.has(thisWeek) || info.teaching === false) {
      parts.push(
        `<p>There is no teaching this week, and no lecture will be posted. Please use this time for Professional Experience (where applicable) and to stay on top of assessment requirements. Check the ${portalLink(
          unitCfg
        )} and unit announcements for any updates.</p>`
      );
    } else {
      parts.push(
        `<p>Learning materials for this week are available in the ${escapeHtml(
          unitCfg.itemLabel.toLowerCase()
        )} tiles below. Please check the ${portalLink(
          unitCfg
        )} for full task instructions and submission details.</p>`
      );
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
    if (!(Events.noTeachingWeeks.has(thisWeek) || info.teaching === false)) {
      parts.push(
        `<div><strong>Live session (${escapeHtml(unitCfg.liveDay)} ${escapeHtml(unitCfg.liveTime)})</strong></div>`
      );
      parts.push(`<div>${info.live ? escapeHtml(info.live) : "See the Live Sessions details below."}</div>`);
    }
  }

  document.getElementById("heading").innerHTML = heading;
  document.getElementById("details").innerHTML = parts.filter(Boolean).join("\n");
}
