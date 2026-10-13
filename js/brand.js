// The app's name and mascot, in ONE place. To rename the app or swap the
// mascot, change these values (and the <title> in index.html).
// Mascot pictures are cut out with tools/process_mascot.py (WebP, transparent).
export const APP_NAME = "Spreadsheets practice";
export const APP_SHORT = "Spreadsheets"; // the phone top bar has less room

export const MASCOT = {
  name: "Pip",                       // used in alt text and tips ("Pip's tip")
  species: "penguin",
  // One picture per mood. They can all be the same file.
  poses: {
    explain: "assets/mascot/mascot.webp",   // learn cards, path, brand avatar
    happy: "assets/mascot/mascot.webp",     // right answers, level complete
    encourage: "assets/mascot/mascot.webp", // "not yet", quit dialog
  },
  // How to crop the round avatar (sidebar / top bar): object-position and scale.
  avatar: { position: "50% 18%", scale: 1.5 },
};

export function mascotSrc(pose = "explain") {
  return MASCOT.poses[pose] || MASCOT.poses.explain;
}
