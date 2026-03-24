// autovideos.js

class VideoURLs {
  // =========================
  // Existing (fortnightly) sets
  // =========================
  static EDIT415 = [
    "rBWThyNIaCo", // Welcome
    //"EB3Qe97fSNs", // Week 0
    "62E7uN-JpVQ", // Week 1 & 2
    "HeOTSF4_-Es", // Week 3 & 4
    "nbPbzy1Uaws", // Week 5 & 6
    "DGIXT7ce3vQ",
    "hDQsbAbt2QU", // Week 9 & 10
    "qcU_i2rTmM8", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  static EDIT425 = [
    "lYDw05HIayE", // Welcome
    //"EB3Qe97fSNs", // Week 0
    "14qnVK60YXM", // Week 1 & 2
    "NAmeFmSnJqA", // Week 3 & 4
    "fml5R_r4DLo", // Week 5 & 6
    "DGIXT7ce3vQ", // Assessment & Intensive Period
    "kffeQ3_CLqQ", // Week 9 & 10
    "yNSs6PKChRI", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  static EDIT426 = [
    "alhCYDrtgzs", // Welcome
    //"75Z7kif2Jtc", // Week 0
    "r_fTa8QmIRQ", // Week 1 & 2
    "Mt8UdXTMLW0", // Week 3 & 4
    "HRbNPuBJ-F4", // Week 5 & 6
    "kP9hgtJpW9w", // Week 7 & 8
    "DGIXT7ce3vQ", // Assessment & Intensive Period
    "S9jirJlhP0U", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  static EDIT513 = [
    "m1OwTkFGlgc", // Welcome (Actually Week 0 for this unit)
    //"rUGDNUxCrn8", // Week 0
    "ebk880UKai8", // Week 1 & 2
    "7LUDYfhahUw", // Week 3 & 4
    "mzFLm7Mr1u4", // Week 5 & 6
    "DGIXT7ce3vQ", // Assessment & Intensive Period
    "01pnXTJ6V20", // Week 9 & 10
    "mv2RA4qrl3Y", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  static EDIT517 = [
    "BcormZe1joc", // Welcome (Actually Week 0 for this unit)
    //"rUGDNUxCrn8", // Week 0
    "nin_fE3wWfI", // Week 1 & 2
    "jk3y-5ykQ2E", // Week 3 & 4
    "J1MFBz5VDKo", // Week 5 & 6
    "DGIXT7ce3vQ", // Assessment & Intensive Period
    "JqvACFLwguk", // Week 9 & 10
    "p6yJEE5Kcf8", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  static EDIT518 = [
    "iayVJ8VdHvM", // Welcome
    //"rUGDNUxCrn8", // Week 0
    "GmKJJ1VDoUE", // Week 1 & 2
    "4S-dsxI1EnY", // Week 3 & 4
    "WuFJokLqF1I", // Week 5 & 6
    "A8X_UrMPu5Y", // Week 9 & 10
    "DGIXT7ce3vQ", // Assessment & Intensive Period
    "zBhnWRT8J7M", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  static EDIT521 = [
    "e5oJX_jEzD0", // Welcome
    //"XZLSHCIqWTM", // Week 0
    "9wAcxp55Bco", // Week 1 & 2
    "Q5t1eaLhM18", // Week 3 & 4
    "o7xXdjoEjlk", // Week 5 & 6
    "5H7CMePLyVg", // Week 9 & 10
    "DGIXT7ce3vQ", // Assessment & Intensive Period
    "SB08-lkRmHA", // Week 11 & 12
    "3UEbA1D7Y-0", // Week 13
  ];

  // ==========================================
  // NEW: Weekly sets for EDSE357 and EDSE358
  // Rule:
  //  - Week 1–8 = weekly rotation (duplicates allowed)
  //  - Week 9–14 (i.e., "weeks 9–15" in common unit language) = DGIXT7ce3vQ
  // Note: dateList in this script runs Week 0..14.
  // ==========================================
  static EDSE357_WEEKLY = [
    "vOe6VqwXMk0", // Week 0 (Welcome)
    "1jVXNAaZ1P8", // Week 1
    "SItTfkDrkKo", // Week 2
    "MOVpOGshy9M", // Week 3
    "brEVCv7P8Tw", // Week 4
    "T4ZrteC1S1A", // Week 5
    "fml5R_r4DLo", // Week 6
    "kffeQ3_CLqQ", // Week 7
    "yNSs6PKChRI", // Week 8
    "DGIXT7ce3vQ", // Week 9  (Assessment & Intensive Period)
    "DGIXT7ce3vQ", // Week 10
    "DGIXT7ce3vQ", // Week 11
    "DGIXT7ce3vQ", // Week 12
    "DGIXT7ce3vQ", // Week 13
    "DGIXT7ce3vQ", // Week 14
  ];

  static EDSE358_WEEKLY = [
    "vOe6VqwXMk0", // Week 0 (Welcome)
    "twvP-4YOPWw", // Week 1
    "mHYoYi15J1Y", // Week 2
    "dZiRQE7dgFA", // Week 3
    "HXhzDcirQ-0", // Week 4
    "6vPFCsOBL3A", // Week 5
    "fml5R_r4DLo", // Week 6
    "kffeQ3_CLqQ", // Week 7
    "yNSs6PKChRI", // Week 8
    "DGIXT7ce3vQ", // Week 9  (Assessment & Intensive Period)
    "DGIXT7ce3vQ", // Week 10
    "DGIXT7ce3vQ", // Week 11
    "DGIXT7ce3vQ", // Week 12
    "DGIXT7ce3vQ", // Week 13
    "DGIXT7ce3vQ", // Week 14
  ];
}

function getDateList(startDate, weeklyInterval, trimester) {
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

    // Tri 3 holiday skip after Week 8 (i.e., starting Week 9)
    if (trimester === "T3" && currentWeek >= 9) {
      thisDate.setDate(thisDate.getDate() + 14);
    }

    thisDate.setHours(0, 0, 0, 0);
    dateList.push({ week: currentWeek, date: thisDate });

    // keep your existing special-case for fortnightly Week 14
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

export function setUpVideos({ forUnit: unit, startDate: theStartDate, andTri: trimester }) {
  const classStartDate = new Date(theStartDate); // YYYY-MM-DD
  classStartDate.setHours(0, 0, 0, 0);

  const today = new Date();

  // Default behaviour stays the same (fortnightly)
  let weeklyInterval = 2;

  // Only EDSE357 and EDSE358 should run weekly
  if (unit === "EDSE357" || unit === "EDSE358") {
    weeklyInterval = 1;
  }

  const dateList = getDateList(classStartDate, weeklyInterval, trimester);

  // Pick correct video list
  let videoPlaceHolders = [];
  switch (unit) {
    case "EDIT415":
      videoPlaceHolders = VideoURLs.EDIT415;
      break;
    case "EDIT425":
      videoPlaceHolders = VideoURLs.EDIT425;
      break;
    case "EDIT426":
      videoPlaceHolders = VideoURLs.EDIT426;
      break;
    case "EDIT513":
      videoPlaceHolders = VideoURLs.EDIT513;
      break;
    case "EDIT517":
      videoPlaceHolders = VideoURLs.EDIT517;
      break;
    case "EDIT518":
      videoPlaceHolders = VideoURLs.EDIT518;
      break;
    case "EDIT521":
      videoPlaceHolders = VideoURLs.EDIT521;
      break;

    // Weekly units
    case "EDSE357":
      videoPlaceHolders = VideoURLs.EDSE357_WEEKLY;
      break;
    case "EDSE358":
      videoPlaceHolders = VideoURLs.EDSE358_WEEKLY;
      break;

    default:
      videoPlaceHolders = [];
  }

  // Compute current index
  let index = getCurrentVideoIndex(today, dateList);

  // Clamp index to available videos so we never crash
  if (!videoPlaceHolders.length) {
    document.getElementsByClassName("embed-container")[0].innerHTML =
      "<div><strong>No video list configured</strong> for this unit.</div>";
    return;
  }
  if (index < 0) index = 0;
  if (index >= videoPlaceHolders.length) index = videoPlaceHolders.length - 1;

  document.getElementsByClassName("embed-container")[0].innerHTML =
    '<iframe src="https://www.youtube.com/embed/' +
    videoPlaceHolders[index] +
    '" title="YouTube video player" width="100%" frameborder="0" ' +
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
}
