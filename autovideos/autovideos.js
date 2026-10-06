// autovideos.js

const BASE = new URL('..', import.meta.url).href;

// Days to add to a week's date for holiday breaks.
// breaks: array of { afterWeek, weeks } for this unit and trimester, or undefined.
// When undefined, keep the legacy rule: T3 adds 14 days from Week 9.
function breakOffsetDays(week, trimester, breaks) {
  if (Array.isArray(breaks)) {
    return breaks.reduce((days, b) => (week > b.afterWeek ? days + b.weeks * 7 : days), 0);
  }
  return trimester === "T3" && week >= 9 ? 14 : 0;
}

function getDateList(startDate, weeklyInterval, trimester, breaks) {
  const dateList = [];

  // Week 0 = 7 days before Week 1
  const week0 = new Date(startDate);
  week0.setDate(week0.getDate() - 7);
  week0.setHours(0, 0, 0, 0);
  dateList.push({ week: 0, date: week0 });

  // Week 1
  const week1 = new Date(startDate);
  week1.setHours(0, 0, 0, 0);
  dateList.push({ week: 1, date: week1 });

  let currentWeek = 2;
  if (weeklyInterval === 2) currentWeek = 3;

  while (currentWeek <= 14) {
    const thisDate = new Date(week0);
    thisDate.setDate(week0.getDate() + currentWeek * 7);

    // Holiday break (unit breaks config, else legacy T3 skip from Week 9)
    thisDate.setDate(thisDate.getDate() + breakOffsetDays(currentWeek, trimester, breaks));

    thisDate.setHours(0, 0, 0, 0);
    dateList.push({ week: currentWeek, date: thisDate });

    // keep existing special-case for fortnightly Week 14
    if (weeklyInterval === 2 && currentWeek === 13) {
      const week14 = new Date(thisDate);
      week14.setDate(thisDate.getDate() + 7);
      week14.setHours(0, 0, 0, 0);
      dateList.push({ week: 14, date: week14 });
    }

    currentWeek += weeklyInterval;
  }

  return dateList;
}

function getCurrentVideoIndex(forToday, fromDateList) {
  // Normalize today to midnight to avoid boundary issues
  const today = new Date(forToday);
  today.setHours(0, 0, 0, 0);

  const thisDateList = fromDateList.map((item) => item.date);

  // Before Week 0
  if (today < thisDateList[0]) return 0;

  // After (or on) last date
  const lastIdx = thisDateList.length - 1;
  if (today >= thisDateList[lastIdx]) return lastIdx;

  // Find the range: [fromDate, toDate)
  for (let i = 0; i < thisDateList.length - 1; i++) {
    const fromDate = thisDateList[i];
    const toDate = thisDateList[i + 1];
    if (today >= fromDate && today < toDate) return i;
  }

  // Fallback
  return 0;
}

function comingSoonHtml(weeklyInterval) {
  const period = weeklyInterval === 2 ? "fortnight" : "week";
  return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
    'text-align:center;padding:1em;background:#eef1f4;color:#2c3e50;font-size:1.1em;">' +
    `This ${period}'s video is coming soon.</div>`;
}

export async function setUpVideos({ forUnit: unit, startDate: theStartDate, andTri: trimester, containerId, forDate }) {
  // containerId: sandpit-only convenience for pages with multiple shells on the same page.
  // Generated production shells omit this — they rely on the embed-container[0] fallback.
  // forDate: test-only override for "today" (ISO date). Production shells omit it.
  const container = containerId
    ? document.getElementById(containerId)
    : document.getElementsByClassName('embed-container')[0];

  const classStartDate = new Date(theStartDate);
  classStartDate.setHours(0, 0, 0, 0);

  const today = forDate ? new Date(forDate) : new Date();

  let unitCfg;
  try {
    const res = await fetch(`${BASE}config/units/${unit}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    unitCfg = await res.json();
  } catch (e) {
    console.error(`autovideos: could not load config for ${unit}:`, e);
    const legacy = VideoURLs[unit];
    if (legacy) {
      console.warn('Using legacy fallback for', unit, '— create config/units/', unit, '.json to migrate');
      let index = getCurrentVideoIndex(today, getDateList(classStartDate, 2, trimester));
      if (index < 0) index = 0;
      if (index >= legacy.length) index = legacy.length - 1;
      container.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' +
        legacy[index] +
        '" title="YouTube video player" width="100%" frameborder="0" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    } else {
      container.innerHTML =
        '<div>Video unavailable — please refresh the page.</div>';
    }
    return;
  }

  const weeklyInterval = unitCfg.videoInterval ?? 2;

  const triKey = `${trimester}-${classStartDate.getFullYear()}`;
  const dateList = getDateList(classStartDate, weeklyInterval, trimester, unitCfg.breaks?.[triKey]);

  if (!unitCfg.weeks || !Object.keys(unitCfg.weeks).length) {
    container.innerHTML =
      '<div>Video unavailable — no videos configured for this unit.</div>';
    return;
  }

  // Look the video up by week number (the first week of the period), not list position
  const index = getCurrentVideoIndex(today, dateList);
  const weekNum = dateList[index].week;
  let videoId = unitCfg.weeks[String(weekNum)]?.video ?? null;

  if (videoId === null) {
    if (unitCfg.videoFallback === "coming-soon") {
      container.innerHTML = comingSoonHtml(weeklyInterval);
      return;
    }
    videoId = 'DGIXT7ce3vQ';
  }

  container.innerHTML =
    '<iframe src="https://www.youtube.com/embed/' +
    videoId +
    '" title="YouTube video player" width="100%" frameborder="0" ' +
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
}

/* LEGACY FALLBACK — EDIT units only. Remove when config JSONs exist for all EDIT units. Do not add new units here. */
class VideoURLs {
  static EDIT415 = [ "rBWThyNIaCo", "62E7uN-JpVQ", "HeOTSF4_-Es", "nbPbzy1Uaws", "DGIXT7ce3vQ", "hDQsbAbt2QU", "qcU_i2rTmM8", "3UEbA1D7Y-0" ];
  static EDIT425 = [ "lYDw05HIayE", "14qnVK60YXM", "NAmeFmSnJqA", "fml5R_r4DLo", "DGIXT7ce3vQ", "kffeQ3_CLqQ", "yNSs6PKChRI", "3UEbA1D7Y-0" ];
  static EDIT426 = [ "alhCYDrtgzs", "r_fTa8QmIRQ", "Mt8UdXTMLW0", "HRbNPuBJ-F4", "kP9hgtJpW9w", "DGIXT7ce3vQ", "S9jirJlhP0U", "3UEbA1D7Y-0" ];
  static EDIT513 = [ "m1OwTkFGlgc", "ebk880UKai8", "7LUDYfhahUw", "mzFLm7Mr1u4", "DGIXT7ce3vQ", "01pnXTJ6V20", "mv2RA4qrl3Y", "3UEbA1D7Y-0" ];
  static EDIT517 = [ "BcormZe1joc", "nin_fE3wWfI", "jk3y-5ykQ2E", "J1MFBz5VDKo", "DGIXT7ce3vQ", "JqvACFLwguk", "p6yJEE5Kcf8", "3UEbA1D7Y-0" ];
  static EDIT521 = [ "e5oJX_jEzD0", "9wAcxp55Bco", "Q5t1eaLhM18", "o7xXdjoEjlk", "5H7CMePLyVg", "DGIXT7ce3vQ", "SB08-lkRmHA", "3UEbA1D7Y-0" ];
}
