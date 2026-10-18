# Google Sheets screenshots: what we have, what would still help

Lessons 6 and 7 tap on real Google Sheets screenshots wherever we have one. The rest are
drawn by the app as **stand-ins**, so each one can be swapped for a real screenshot later.

## How to add one

1. Take the screenshot in the School Fair sample (Takings in A3:E9), on a Chromebook-sized
   window, with nothing hovered (move the pointer away: a grey hover row gives the answer away).
   For "which section/item do you open?" questions the answer must still be closed in the shot.
2. Either crop it yourself and save it as `assets/screens/<filename>.webp`, or put the full
   screenshot in `../spreadsheets/screenshots/google_sheets/menus/` and add a row to
   `tools/crop_screens.py` (crop box + regions), then run `python3 tools/crop_screens.py`.
3. In `content/screens.js`, change that name's one entry from `drawn: {…}` to
   `src: "assets/screens/<filename>.webp", w, h, alt` (and `regions` if it will be tapped).
4. Run `node tools/check_content.mjs`: it says if an exercise names a region the picture doesn't have.

Nothing in `content/practice.js` needs to change for a stand-in. New *tap it* questions need
regions, so they're a small edit to `content/practice.js` too.

## Already real (Oct 2026 screenshots, cropped by `tools/crop_screens.py`)

| Name in `content/screens.js` | From | Used for |
|---|---|---|
| `menu-bar` | 11 (menu bar only) | Which menu sorts (Data)? Which menu makes a chart (Insert)? |
| `data-menu` | 01 | Data → Sort range (not Sort sheet) |
| `data-menu-sort-range` | 02 | Advanced range sorting options (learn card + tap) |
| `sort-window` | 03 | Sort by, Z to A, then by, Add another sort column, Sort; "why does Sort by say Stall?" (Data has header row is already ticked here, so it's a choice, not a tap) |
| `insert-menu` | 04 (Chart row's hover removed) | Insert → Chart |
| `chart-type` | 05 (the column chart's blue "chosen" border repainted grey) | Tap the pie / column / bar chart in the Chart type list |
| `setup-column` | 06a | Chart editor learn card; Customise tab, Chart type, Data range, Switch rows/columns |
| `setup-switched` | 06b | Where are the stalls after Switch rows/columns? (the legend) |
| `customise-pie` | 09 (top part: every section closed) | Which section do you open? Pie slice; Chart and axis titles |
| `titles` | 07 | Title text, the list for picking which title (the section is already open) |
| `pie-slice` | 08a (cropped above the colour list) | Learn card; pick the slice (Pie slice is already open) |
| `series-colour` | 08b (cropped above the colour list) | Pick the series (Series is already open) |
| `legend` | 09 | The legend on the chart; Legend → Position, Legend font size |
| `chart-menu` | 10 (Edit the chart's hover removed) | ⋮ → Edit the chart, ⋮ → Move to own sheet |
| `chart-selected` | 11 | ⋮, the corner handle (resize), the chart itself (move) |

## Still wanted

Most useful first. "Stand-in" means the app draws it now and swaps it in with one entry.

| # | Filename | Lesson | Exact state to capture | What must be visible | Replaces |
|---|---|---|---|---|---|
| 1 | `two-ranges.webp` | 7 | Click A3, drag to A9, hold **Ctrl**, drag E3 to E9. Let go. | Both ranges blue (A3:A9 and E3:E9), B to D not selected, column letters and row numbers 1–9, the School Fair Takings title in A1. Name Box in view if it fits. | stand-in `two-ranges` (learn card for *select two separate ranges*) |
| 2 | `own-sheet-tab.webp` | 7 | A pie chart → ⋮ → Move to own sheet. Don't rename the new tab yet. | The sheet tabs bar along the bottom: the old tab and the new **Chart1** tab (open), plus some of the chart above it. | stand-in `own-sheet-tab` |
| 3 | `chart-over-data.webp` | 7 | Insert → Chart from A3:A9 + E3:E9, and leave the new chart where Sheets puts it, over the table. Click a cell so the editor closes. | The chart covering some of the numbers in B to E. | stand-in `chart-over-data` |
| 4 | `chart-beside-data.webp` | 7 | The same chart dragged to the right of the table (column G), a bit bigger. | The whole table A1:E9 and the chart beside it, nothing covered. | stand-in `chart-beside-data` |
| 5 | `titles-list.webp` | 7 | Column chart from A3:D9 → Customise → Chart and axis titles → click the **Chart title ▾** list so it opens. | The open list: Chart title, Chart subtitle, Horizontal axis title, Vertical axis title. | would let *axis titles* ask "tap Vertical axis title" on the real list (today it taps the closed list on `titles`) |
| 6 | `axis-titles.webp` | 7 | The same column chart with Horizontal axis title **Stall** and Vertical axis title **Takings ($)** typed in; Vertical axis title picked in the list. | The chart with both axis titles, and the Title text box showing Takings ($). | the drawn *Afternoon Takings* chart in the axis-titles questions (could stay drawn: it's a chart, not a menu) |
| 7 | `legend-position.webp` | 7 | Pie chart → Customise → Legend → click the **Position** list so it opens. | The open list: None, Top, Bottom, Left, Right, Inside, Labelled, Auto. | would turn "Which one puts the legend under the chart?" into a tap on the real list |
| 8 | `sort-window-no-header.webp` | 6 | Select A3:E9 → Data → Sort range → Advanced range sorting options, and **untick** Data has header row. | Sort by showing **Column A** (not Stall). | would let *data has header row* show what goes wrong without the tick |
| 9 | `chart-type-bar.webp` | 7 | Setup → Chart type list, scrolled down to the **Bar** section (and Pie above it if it fits). | The Bar chart pictures with their section heading. | optional: `chart-type` already shows a bar chart under Suggested |
| 10 | `stacking.webp` | 7 | Select A3:D9 → Insert → Chart, before changing anything. | The default **stacked** column chart and Setup → Stacking: Standard. | only if Stacking → None is added to the Knowledge Bank (the slides' column chart needs it: Sheets stacks by default) |
| 11 | `customise-column.webp` | 7 | Column chart from A3:D9 → Customise, with **every section closed**. | Chart style, Chart and axis titles, Series, Legend, Horizontal axis, Vertical axis, all with › chevrons. | would make "which section do you open for a series colour?" a tap (it's a choice now, because 08b has Series open) |

Not needed: the Customise sections themselves (Chart style, Pie chart, Pie slice, Chart and axis
titles, Legend, Series) are all in the shots above, and every chart in the questions (pie,
column, bar, switched) is drawn on purpose, with patterns as well as colours, so it can show
exactly the data a question needs.
