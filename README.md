# Spreadsheets practice

Home practice for Year 7 ICT, Duolingo-style, alongside the explicit teaching in class:
small steps, a learn card before each new term, immediate kind feedback, and wrong
answers coming back later. Students use it in the browser on a Chromebook or a phone.

**Live:** https://wanly20.github.io/spreadsheets/ (GitHub Pages from `main`, repo root).
Static files only, with no build step. To try it locally, run `python3 -m http.server 8765` here and open
http://127.0.0.1:8765/.

- **Path:** each lesson is split into levels of 4–6 new terms (in slide order), then a *Mixed
  review*. Every level has 8–12 questions. Stars (by first-try accuracy), XP and the day streak
  are saved in this browser (localStorage). There are no accounts, no personal data and no analytics.
- **Review** (sidebar or the ↻ button) brings back the terms a student got wrong or hasn't seen
  for a while (a simple spaced-repetition box per term).
- **My knowledge** lists every term met so far, split into Know / Do, with *Learnt / Getting
  there / Needs review*.
- **Settings:** sound on/off, *Download my progress* (a small `.txt` file), *Load my progress*
  (checks the file and asks first), *Reset progress*.
- A hidden page, **`#/play/sampler`**, shows one of every exercise type, and **`#/play/gallery-7`**
  (any lesson number) plays every learn card and hand-made exercise of that lesson, in order.

## Updating the content (the Knowledge Bank)

The terms and definitions come **only** from the unit's Knowledge Bank. Never edit
`content/knowledge_lessonN.js` by hand: they are byte-for-byte copies.

1. Edit `../spreadsheets/spreadsheets_knowledge_list.xlsx` as usual, then save and close it.
2. From this folder, run:

       tools/sync_content.sh --xlsx

   This runs `sync_knowledge.py` (xlsx → `knowledge_lessonN.js`), copies the files for every
   ready lesson into `content/`, and runs the content checker. If you have already run
   `sync_knowledge.py` yourself, just run `tools/sync_content.sh`.
3. If the checker says **Content OK**, publish (commit and push).

The checker (`node tools/check_content.mjs`) stops with a clear message if, for example, a level
names a term that no longer exists, or an extra exercise no longer matches its definition. Every
extra exercise in `content/practice.js` names a `fact`, a phrase that must appear in the
definition, so an exercise can't contradict a definition you've changed. A renamed or new term
still works straight away: it gets the automatic "term ↔ definition" questions and joins the
nearest level. The checker tells you so you can tidy up the level list.

**Automatic questions.** Every term gets them, straight from its definition:
- *Fill the gaps*: when the definition has `[[…]]` words, each one becomes a numbered gap and the
  student taps word chips into them (the wrong chips are other terms' `[[…]]` words in the same lesson).
- *Which term matches?*: shows the `review` text if there is one, otherwise the definition with the
  `[[ ]]` marks removed. It never shows gaps, and it's skipped when a `[[…]]` word is part of the term
  (e.g. `[[Fill]]` in "fill colour"), because that would give the answer away; Fill the gaps covers it.
- *What does this mean?*: the term, with three definitions to choose from.

## Where things live

| File | What it is |
|---|---|
| `content/knowledge_lessonN.js` | Copies of the Knowledge Bank (generated: don't edit) |
| `content/course.js` | The path: lessons, their levels (lists of terms), "coming soon" |
| `content/practice.js` | Learn-card pictures and extra exercises for each term (grid, fill, keys, hotspots, steps, formulas, locking a reference with $, predicting a formula after a fill down or across, predicting a sort, two ranges with Ctrl, choosing a chart…) |
| `content/screens.js` | Real Google Sheets screenshots and their tappable areas, plus drawn stand-ins for the ones not photographed yet (`docs/SCREENSHOTS_WANTED.md`) |
| `tools/crop_screens.py` | Crops the Lesson 6–7 screenshots (`../spreadsheets/screenshots/google_sheets/menus/`) into `assets/screens/` and prints their regions |
| `js/brand.js` | **App name and mascot, in one place** |
| `js/course.js` | Builds levels and reviews from the content |
| `js/exercises.js` · `js/grid.js` · `js/visuals.js` | Exercise types, the mini spreadsheet (incl. two ranges with Ctrl), pictures |
| `js/charts.js` | Drawn pie, column and bar charts (inline SVG): each series has a colour **and** a pattern, for colour-blind students |
| `js/sort.js` | Sorting a small table like Google Sheets, and the likely mistakes (for *Predict the sort*) |
| `js/lesson.js` · `js/app.js` · `js/store.js` | Lesson runner, screens and settings, saved progress |
| `css/tokens.css` | Colours, type and spacing (`python3 tools/contrast.py` checks WCAG AA) |

## Adding a lesson (Lessons 1–7 are in)

1. In `content/course.js`, add the lesson after the last one (`n: 8`, a title, a subtitle and a theme: the next unused lesson colour, e.g. brown or olive; never yellow, which means "done"), with its levels.
   Each level is a list of 2–6 terms, copied exactly from `knowledge_lesson8.js`, in slide order.
   Add `review: { id: "8-r", title: "Mixed review" }`. To show it early as a teaser, use `comingSoon: true` instead of levels.
2. Run `tools/sync_content.sh`: it copies `knowledge_lesson8.js` and checks everything.
3. Optional but worthwhile: in `content/practice.js`, add a learn-card picture and a few hands-on
   exercises for each new term. The comments at the top of that file list the exercise types.
   Without them, every term still gets term ↔ definition questions.
4. To include it in the big review at the end of the path, add its number to `finalReview.needs` and update the title in `content/course.js`.

## Changing the name or the mascot

Edit `js/brand.js` (and the `<title>` in `index.html`). To use a new mascot picture, cut it out and
export it as WebP with the mascot tool. It runs on the CPU only:

    ~/Documents/video_generation/Wan2GP/.venv/bin/python tools/process_mascot.py design/mascot/NEW.png assets/mascot/mascot.webp

The current mascot is Pip, from `design/mascot/penguin_laptop_s3.png`.

## Tests

Set up once, outside the repo: `mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright-core@1.48.2`.
Then serve the app (`python3 -m http.server 8765 --bind 127.0.0.1`) and run:

    node tools/check_content.mjs                                   # content
    NODE_PATH=/tmp/pw/node_modules node tools/e2e.mjs screenshots  # every level, 1366×768 and 390×844
    NODE_PATH=/tmp/pw/node_modules node tools/e2e-keyboard.mjs     # keyboard only
    python3 tools/contrast.py                                      # colour contrast

Chromium runs fully headless with software rendering: no GPU, and no window.
