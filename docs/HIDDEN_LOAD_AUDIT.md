# Hidden load audit (1 November 2026)

**The bug:** a level teaches the terms it lists, but its learn cards and questions also use other terms, menu
names or ideas that come later. Students then meet more new things than the level says.

**The check:** `node tools/check_content.mjs` now runs it every time (in `tools/hidden_load.mjs`).
`node tools/check_content.mjs --load` prints every level: its terms, the hidden extras it uses for the
first time, and every flag.

## How the check works

- **What it looks for:** a list of things a level can name (`THINGS` in `tools/hidden_load.mjs`):
  - every Knowledge Bank term, and the words that point to it ("frozen" means freeze, "A to Z" means sort);
  - Google Sheets menus, menu items and buttons ("View →", "Custom date and time", "Copy to", "⋮");
  - function names (SUM, MAX, MIN, AVERAGE, or any other);
  - syntax: a formula `=…`, `*` and `/`, a range `A1:B3`, `$A$1`, `10%` in a cell, brackets in a formula;
  - shortcuts: every Ctrl/Alt + key, holding Ctrl, the Delete key, F4.
- **Where a thing is taught:** at the level of the term it belongs to (`$B$1` belongs to *absolute
  reference*). A thing with no term of its own (a menu, a gesture) is taught at the first level whose
  Knowledge Bank definition names it. So *the View menu* is taught in 2-3, where the freeze definition
  says "View → Freeze".
- **What it reads in each level:**
  - the level title;
  - the Knowledge Bank definitions (and review text) of its terms;
  - in `practice.js`: learn-card notes, captions, keys, steps and the formulas shown, plus every exercise's
    prompt, hint, right and wrong options, steps, why, tips and formulas;
  - in `screens.js`: the label shown as a hotspot's answer;
  - contrast texts and gap chips;
  - what the exercise screen itself always shows (a lockRef screen always says F4);
  - the automatic questions the level really builds, over 30 shuffles: their wrong terms, wrong
    definitions and wrong chips.
- **A flag** is something named in a level when it is taught in a later level, or never.
  - **Error** (the check fails) when it is in `practice.js`, `screens.js` or `course.js`. Fix the wording,
    or add it to `ALLOW` with a reason.
  - **Warning** when it is in a Knowledge Bank definition (fix it in the xlsx), in an automatic question,
    or in `js/exercises.js`.
- **Hotspot tips:** a tip only shows after the student taps that very area of the real screenshot. So the
  tip can say what that area is ("That's Text rotation…") without being flagged.
- **New things per level:** the level's terms, plus every thing it uses for the first time that none of
  its terms teaches (its "hidden extras"). Above 6 is a warning.

### Assumed known (never flagged)

My judgement, based on the README (a Year 7 class with explicit teaching, using Chromebooks) and Lesson 1,
which starts from "a grid that stores data":

- **Using a computer:**
  - click, double-click, tap, drag, hover, scroll, select, type, press;
  - the keys Enter, Shift, Space, Esc, Backspace, the letter keys and the number keys. **Shift + a key**
    types a sign (Shift + 8 gives `*`), so it counts as typing, not as a shortcut;
  - screen, button, menu (in general), toolbar, window, box, tick box, list, file, icon, cursor,
    Windows, Chromebook, Google Sheets.
- **Maths:** numbers and decimals, + − × ÷, total, add up, average/mean, highest/lowest, percentages as
  maths ("26.6% of the players"), money ($2, $7.50), decimal places.
- **Everyday words:** data, table, heading, value, text, word, name, list, grid, line; top, bottom, left,
  right, middle, centre, background, colour, bigger, wider, taller.
- **Not assumed:** *cell, row, column* and *spreadsheet*. Level 1-1 teaches them, so they are taught
  before anything else uses them anyway.

### Accepted on purpose (`ALLOW`)

| Level | Thing | Why it's allowed |
|---|---|---|
| 1-5 | "Copy to" (gap chip for *duplicate a sheet*) | It sits right under Duplicate in the real tab menu, and it's the one students mix up with it. The Duplicate hotspot tip says what it does. |
| 2-2 | "the bar above the grid" (*format vs value*) | To see that a cell holds 7.5 while it shows $7.50, students need the bar. The card says where it is. Lesson 3 names it as part of *formula*. |

Juan, please confirm both of these, or say which way you want them changed.

## Summary

Count of flagged uses before the fixes (one use = one thing in one field):

| Lesson | In practice.js | Knowledge Bank | Automatic questions | js/exercises.js | Left after the fixes |
|---|---|---|---|---|---|
| 1 | 29 | 1 | 1 | 0 | 1 KB, 1 automatic (both from the same definition) |
| 2 | 18 | 0 | 0 | 0 | 0 |
| 3 | 3 | 0 | 0 | 0 | 0 |
| 4 | 3 | 0 | 0 | 3 | 3 js (the F4 hint) |
| 5 | 2 | 0 | 0 | 1 | 1 js (the F4 hint) |
| 6 | 0 | 0 | 0 | 0 | 0 |
| 7 | 4 | 2 | 0 | 0 | 2 KB |

Nothing was flagged in `screens.js` or `course.js`. The automatic questions never take a wrong option from
a later level (`js/course.js` already uses only terms the student has met). The one automatic flag comes
from a Knowledge Bank definition that is itself a flag.

New things per level, before and after the fixes:

| Level | Terms | Before | After | What's left over 6 |
|---|---|---|---|---|
| 1-1 | 5 | 9 | 5 | |
| 1-2 | 5 | 9 | 5 | |
| 1-3 | 4 | 11 | 5 | |
| 1-4 | 4 | 5 | 4 | |
| 1-5 | 6 | 10 | **8** | two-finger tap / right-click; Copy to |
| 2-1 | 5 | 6 | 5 | |
| 2-2 | 4 | 11 | **8** | the Format menu; the File menu; File → Settings; the bar above the grid |
| 2-3 | 5 | 11 | **7** | Format → Number; the View menu |
| 3-1 | 3 | 5 | 3 | |
| 3-2 | 3 | 4 | 3 | |
| 3-3 | 4 | 4 | 4 | |
| 4-1 | 3 | 6 | 4 | (F4, from js/exercises.js) |
| 4-2 to 6-2 | 2–3 | 2–3 | 2–4 | |
| 7-1 | 4 | 7 | **8** | the Insert menu; ⋮; legend; titles |
| 7-2 | 4 | 5 | 4 | |
| 7-3 | 5 | 5 | 5 | |

(7-1 went up by one after the fixes. Before, "Insert →" had already turned up as a wrong option back in
Lesson 2, so it didn't count as new in 7-1.)

## Findings, by lesson and level

Status:
- **Fixed** means I changed `content/practice.js`.
- **KB** means the wording is in the Knowledge Bank: see the xlsx changes below.
- **Allowed** means it's in `ALLOW` (above).
- **Code** means it's in `js/exercises.js`: see "Code change" below.

### Lesson 1

**1-1 The grid** (spreadsheet, cell, column, row, cell reference)

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `spreadsheet` learn card: note, and the grid's bar showing `=B2*C2` | formula, `=…`, `*`, the bar above the grid | 3-1 | The note now says "You didn't type the Total: the spreadsheet works it out for you (Price × Qty)…". The card no longer shows a formula in the bar. | Fixed |
| `spreadsheet` ex 1 (core): prompt, right answer, why, and the bar showing `=B2*C2` | formula, `=B2*C2` | 3-1 | Now "D2 multiplies the Price by the Qty by itself…" with the answer "6: the spreadsheet works it out for you". | Fixed |

**1-2 Ranges and the fill handle**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `Name Box` gap chips: "tab" | sheet tab | 1-5 | Now "row" | Fixed |
| `Name Box` ex 3 (keys, core): wrong options "Delete", "Ctrl + Z" | Delete key, undo | 1-3 | Now "Space", "Shift", "Esc" | Fixed |
| `fill handle` gap chips: "tab" | sheet tab | 1-5 | Now "cell" | Fixed |
| `fill handle` ex 3: wrong option "A paint bucket" | fill colour | 1-4 | Now "A small grey square" | Fixed |

**1-3 Move, clear and undo**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| Definition of *clear cell contents*: "…not any formatting." | formatting | 1-4 | Change the xlsx wording (below) | **KB** |
| Automatic "What does this mean?" for *undo*, which shows that definition as a wrong option | formatting | 1-4 | Goes away with the KB change | KB |
| `clear cell contents` learn note: "Formatting is how a cell looks: its background colour, bold, borders…" | formatting, bold, borders | 1-4 | Now "Delete empties the cell, but the cell keeps its look: a green background stays green…" | Fixed |
| `clear cell contents` gap chips: "clears the formatting", "deletes the whole row" | formatting; delete a row | 1-4; 4-2 | Now "clears the look", "removes the whole row" | Fixed |
| `clear cell contents` ex 2 why: "A background colour is formatting…" | formatting | 1-4 | Now "Delete clears the contents only: the 42 goes, and the green background stays." | Fixed |
| `undo` ex 1 (keys, core): wrong options "Ctrl + X", "Ctrl + U" | shortcuts never taught | never | Now "Delete", "Enter" | Fixed |
| `redo` ex 1 (keys, core): wrong option "Ctrl + B" | a shortcut never taught | never | Now "Enter" | Fixed |

**1-4 Formatting**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `fill colour` ex 2: wrong option "The colour of the sheet tab" | sheet tab | 1-5 | Now "The size of the writing" | Fixed |
| `borders` ex 2: wrong option "Width, height and wrap" | text wrapping | 2-1 | Now "Width, height and position" | Fixed |

**1-5 Sheets**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `insert a sheet` ex 2: wrong option "In the Format menu" | the Format menu | 2-2 | Now "Next to the Bold button" | Fixed |
| `duplicate a sheet` gap chips: "Copy to" | Copy to | never | Kept on purpose | Allowed |
| `move a sheet` gap chips: "Copy to" | Copy to | never | Now "Change colour" (same level) | Fixed |
| `colour a sheet tab` gap chips: "Tab colour" | not a real Sheets item | never | Now "Duplicate" | Fixed |

### Lesson 2

**2-1 Fit the cells**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `row height` ex 2: wrong option "Merge the row's cells" | merge cells | 2-2 | Now "Make the text bold" | Fixed |

The first run also flagged "centre" (in "In the middle, in the centre") and the hotspot tips "That's Horizontal
align…" and "That's Text rotation…". "centre" is an everyday word (it's on the assumed-known list). The tips
only show after the student taps that very button, so the check no longer flags them.

**2-2 Merge, align and locale**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `merge cells` gap chips: "View", "Insert" | the View menu; the Insert menu | 2-3; 7-1 | Now "File", "wrap" (with "borders" kept) | Fixed |
| `locale` ex 2: wrong options "Format → Number → Locale", "View → Locale", "Format → Conditional formatting" | Format → Number; View; conditional formatting | 2-3 | Now "Format → Locale", "Format → Merge cells", "Right-click the cell → Locale" | Fixed |
| `format vs value` learn note, and ex 1 why: "the formula bar" | formula (by name) | 3-1 | Now "the bar above the grid (next to fx)" | Fixed |
| `format vs value`: the bar above the grid itself | the bar | 3-1 | Kept on purpose | Allowed |

**2-3 Dates, money and growing sheets**

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| `date format` gap chips: "Date time", "Time" | Number formats never taught | never | Now "Currency", "Number", "Locale" | Fixed |
| `currency format` gap chips: "Plain text", "Time" | never taught | never | Now "Date", "Number", "Locale" | Fixed |
| `currency format` ex 4: wrong option "Insert → Currency" | the Insert menu | 7-1 | Now "Right-click the cell → Currency" | Fixed |
| `insert row/column` gap chips: "Delete row, or Delete column", "Hide row…", "Resize row…" | delete a row; never-taught row-menu items | 4-2; never | Now "Freeze 1 row, or Freeze 1 column", "Move right, or Move left", "Merge all, or Merge cells" | Fixed |
| `freeze` gap chips: "Zoom", "Group", "Show" | View menu items never taught | never | Now "Merge", "Wrap", "Locale" | Fixed |
| `freeze` ex 4 (core): wrong option "Insert → Freeze" | the Insert menu | 7-1 | Now "Double-click row 1" | Fixed |
| `conditional formatting` gap chips: "Alternating colours", "Clear formatting" | Format menu items never taught | never | Now "Merge cells", "Currency" (with "button" kept) | Fixed |
| `conditional formatting` ex 4: wrong option "Data → Freeze" | the Data menu | 6-2 | Now "View → Freeze" | Fixed |

The tips in the `date format` and `currency format` hotspots ("Date time adds the time too…", "Currency rounded
drops the cents…") explain the very item the student tapped. They are fine and now pass.

### Lesson 3

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| 3-1 `operators` ex 3: wrong options "Ctrl + 8", "Alt + 8" | shortcuts never taught | never | Now "Shift + 7", "The x key" (with "Shift + X" kept) | Fixed |
| 3-2 `show formulas` ex 1 (keys): wrong option "Ctrl + F" | a shortcut never taught | never | Now "Enter" | Fixed |

### Lesson 4

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| 4-1 `absolute reference` ex 4: wrong options "Ctrl + 4", "Alt + 4" | shortcuts never taught | never | Now "Shift + 3", "Shift + 5" (with "Shift + 8" kept) | Fixed |
| 4-2 `when to lock a reference` ex 4 hint: "On Windows: press F4." | F4 (the Knowledge Bank says "$ is Shift + 4") | never | Now "Lock the price with $ (Shift + 4)." | Fixed |
| Every lockRef exercise (4-1, 4-2, 5-3): the screen's own hint, "On Windows: … press **F4**" | F4 | never | Change `js/exercises.js` (below) | **Code** |
| 4-2 `delete a row or column` hotspot tips "Clear row…", "Hide row…" | row-menu items | never | These name what the student tapped, so they're fine | (passes now) |

### Lesson 5

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| 5-2 `percentage format` ex 4: wrong options "Insert → Percent", "Data → Number → Percent" | the Insert and Data menus | 7-1; 6-2 | Now "File → Settings → Percent", "Format → Number → Currency" (with "View → Percent" kept) | Fixed |
| 5-3 lockRef screen hint (F4) | F4 | never | See "Code change" | **Code** |

### Lesson 6

Nothing flagged.

### Lesson 7

| Where | Used early | Taught in | Fix | Status |
|---|---|---|---|---|
| 7-1 definition of *chart editor*: "Customise (titles, colours, legend)" | legend; titles | 7-2 | Change the xlsx wording (below) | **KB** |
| 7-1 `chart editor` learn note: "Customise: titles, colours, the legend." | legend; titles | 7-2 | Now "Customise: how the chart looks, like its colours." | Fixed |
| 7-1 `chart editor` ex 1: "…how the chart looks: its titles and colours." | titles | 7-2 | Now "…how the chart looks, like its colours." | Fixed |
| 7-2 `change a slice or series colour` ex 6: "In a column chart, what is a series?" | column chart | 7-3 | Now "In this chart, what is a series?", with the Takings by Session column chart shown | Fixed |

## Levels with more than 6 new things (after the fixes)

These are left for Juan to decide. Each fix means a new level, and a new level shows up as the "current"
node for students who are already past it (`currentNode()` in `js/app.js` picks the first level without
stars).

- **1-5 Sheets: 8** (6 terms, plus two-finger tap / right-click and Copy to).
  - Six terms is already the most a level should have.
  - Proposal: split it into **1-5 "Add and name sheets"** (sheet, insert a sheet, rename a sheet: 3 new things)
    and **1-6 "The tab menu"** (duplicate a sheet, move a sheet, colour a sheet tab, plus two-finger tap and
    Copy to: 5).
- **2-2 Merge, align and locale: 8** (4 terms, plus the Format menu, the File menu, File → Settings, and the bar
  above the grid). Each of the four comes from a definition's own "how to", so rewording can't remove them.
  - Proposal: split it into **"Merge and align"** (merge cells, horizontal alignment, plus the Format menu: 3)
    and **"Locale and what a cell holds"** (locale, format vs value, plus the File menu, Settings and the bar: 5).
- **2-3 Dates, money and growing sheets: 7** (5 terms, plus Format → Number and the View menu).
  - Proposal: move *freeze* and *conditional formatting* into a level of their own: "Big sheets" (freeze,
    conditional formatting, plus the View menu: 3). Dates, money and insert row/column stay (3 + Format → Number).
  - Together with the 2-2 split, Lesson 2 would have 5 levels.
- **7-1 Make a chart: 8** (4 terms, plus the Insert menu, ⋮, legend and titles).
  - With the xlsx change below, it drops to **6**, which is fine.

## Knowledge Bank: changes for Juan to make in the xlsx (report only)

I didn't edit `content/knowledge_lessonN.js` (it's generated).

1. **Lesson 1, *clear cell contents*** (slide 19)
   - Now: `Click the cell and press Delete to empty it — [[clears the contents]] only, not any formatting.`
   - Proposed: `Click the cell and press Delete to empty it — [[clears the contents]] only: the cell keeps its look, like its background colour.`
   - Why: "formatting" is taught in 1-4 (slide 35). This definition is in 1-3, and it also turns up as a
     wrong option in *undo*'s automatic question.
   - Knock-on: `practice.js` "clear cell contents" ex 2 has `fact: "not any formatting"`. Change it to
     `fact: "the cell keeps its look"` in the same sync. Otherwise the checker stops, which is what it's for.
     The slide could use the same words.
2. **Lesson 7, *chart editor*** (slide 3)
   - Now: `… Setup (chart type, which cells) and Customise (titles, colours, legend). Lost it? ⋮ on the chart → [[Edit the chart]].`
   - Proposed: `… Setup (chart type, which cells) and Customise (how the chart looks: colours and more). Lost it? ⋮ on the chart → [[Edit the chart]].`
   - Why: *legend* and *chart title* are taught in 7-2. This brings 7-1 down from 8 to 6 new things.
   - Knock-on: `practice.js` "chart editor" ex 1 has `fact: "titles, colours, legend"`. Change it to
     `fact: "how the chart looks"`.

No other definition names a term from a later level. Some definitions do bring in a menu path of their own,
which counts towards a level's new things (*locale*: File → Settings; *merge cells*: Format → …; *freeze*:
View → …; *date format*: Format → Number; *chart*: Insert →; *chart editor*: ⋮). That's expected: it's the
"how to" of the term. It's why 2-2 and 2-3 are over 6.

## Code change (not made: outside content/)

`js/exercises.js` line 1099, the hint on every "lock the reference" screen, says: "On Windows: click the
reference in the formula and press **F4**. On a Chromebook: type **$** (Shift + 4)." The Knowledge Bank
only teaches "$ is Shift + 4", and students use Chromebooks. Proposed: "Type **$** (Shift + 4) to lock it,
or tap the reference." When that's changed, also delete the `"press F4"` entry in the `implied` lockRef
list in `tools/hidden_load.mjs`.

## What the check can't see

- **Pictures:** it reads words, not screenshots or drawn grids. A toolbar screenshot shows every button,
  but only the words the app writes count.
- **Ideas with no fixed wording:** "the order of a subtraction" or "a fixed number in a formula" have no
  set phrase to search for, so they aren't in `THINGS`.
- **Untapped hotspot areas:** the labels of areas a student doesn't tap are never shown, so the check
  doesn't read them.
- **Screen-reader alt text** of the screenshots isn't read.
- **New wording:** if you add a menu or button name to `practice.js`, add a line for it to `THINGS`, with
  the term that teaches it (or `null`).
