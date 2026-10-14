// Extra practice for each knowledge item, keyed by its exact `term`.
//
// The term and definition always come from knowledge_lessonN.js (never copied
// here). This file adds: a picture for the learn card, and exercises beyond the
// automatic "term ↔ definition" questions every item gets.
//
// Every exercise names a `fact`: a short phrase that must appear in the item's
// definition. tools/check_content.mjs stops if it doesn't, so an exercise can
// never drift away from (or contradict) the definition when the spreadsheet changes.
//
// Exercise types (see js/exercises.js):
//   choice     prompt + visual? + correct + wrong[]           (options are shuffled)
//   gridClick  click a cell / column header / row header / the fill handle
//   gridName   a cell is highlighted: type its reference
//   gridRange  drag to select a range
//   rangeName  a range is highlighted: type it
//   fill       predict what the fill handle makes (answers are worked out, then animated)
//   fillFormula predict a formula after a fill down or across (formula: "=MAX(B2:B5)", from: "B6", to: "D6", grid?)
//              (the options are worked out: the right one and three likely mistakes; then the fill is animated)
//   gridMove   drag a cell to a new place
//   keys       press the real shortcut (multiple choice on touch screens)
//   hotspot    tap something on a real screenshot (`screen`) or a drawn part of Sheets (`ui`)
//   order      put the steps in order
//   formula    type a formula (accept: [...], hint?: a line under the prompt); $ is fine to type
//   lockRef    tap the references in a formula to lock them with $ (formula: "=A2*D1", lock: ["D1"])
// Grid targets can be a list: one is picked at random each time.

const shop = { A1: "Item", B1: "Price", C1: "Qty", D1: "Total", A2: "Pen", B2: 2, C2: 3, D2: 6, A3: "Ruler", B3: 3, C3: 2, D3: 6 };

// Lesson 5: one team's points (MAX 30, MIN 9, SUM 94, AVERAGE 18.8).
const pts = { A1: "Team", B1: "Points", A2: "Rockets", B2: 12, A3: "Comets", B3: 30, A4: "Stars", B4: 18, A5: "Meteors", B5: 25, A6: "Planets", B6: 9 };
const ptsStyle = { A1: { b: 1 }, B1: { b: 1 }, A8: { b: 1 } };
// Ring toss: a bullseye scores 5, a hit scores 3. Every way of writing it.
const ringToss = [];
for (const a of ["B4*5", "5*B4"]) for (const b of ["C4*3", "3*C4"]) for (const [x, y] of [[a, b], [b, a]]) ringToss.push(`=${x}+${y}`, `=(${x})+(${y})`);

export const practice = {
  // ======================================================= Lesson 1
  spreadsheet: {
    learn: { visual: { grid: { cols: 4, rows: 4, cells: shop, sel: "D2", nameBox: true, formula: "=B2*C2" } }, note: "You typed the Price and the Qty. The spreadsheet worked out the Total in D2 by itself." },
    exercises: [
      { type: "choice", fact: "calculates for you", prompt: "The Pen costs $2 and you buy 3. You didn't type anything in D2. What does the spreadsheet show there?",
        visual: { grid: { cols: 4, rows: 3, cells: { ...shop, D2: "?", A3: "", B3: "", C3: "", D3: "" }, sel: "D2" } },
        correct: "6: it calculates it for you", wrong: ["Nothing: you have to type it", "23", "5"] },
    ],
  },
  cell: {
    learn: { visual: { grid: { cols: 5, rows: 5, sel: "C3" } } },
    exercises: [
      { type: "choice", fact: "One box", prompt: "What is one box in the grid called?", visual: { grid: { cols: 5, rows: 5, sel: "B4" } },
        correct: "A cell", wrong: ["A row", "A column", "A range"] },
    ],
  },
  column: {
    learn: { visual: { grid: { cols: 5, rows: 5, sel: "C:C" } }, note: "Columns go down. Their letters are along the top." },
    exercises: [
      { type: "choice", fact: "going down", prompt: "What is highlighted?", visual: { grid: { cols: 5, rows: 5, sel: "B:B" } },
        correct: "A column", wrong: ["A row", "A cell", "A sheet"] },
      { type: "gridClick", fact: "Named with a letter", target: ["col:D", "col:B", "col:E"] },
      { type: "choice", fact: "Named with a letter", prompt: "How are columns named?", correct: "With letters: A, B, C…", wrong: ["With numbers: 1, 2, 3…", "With colours", "With cell references, like C5"] },
    ],
  },
  row: {
    learn: { visual: { grid: { cols: 5, rows: 5, sel: "3:3" } }, note: "Rows go across. Their numbers are down the side." },
    exercises: [
      { type: "choice", fact: "going across", prompt: "What is highlighted?", visual: { grid: { cols: 5, rows: 5, sel: "4:4" } },
        correct: "A row", wrong: ["A column", "A cell", "A range of columns"] },
      { type: "gridClick", fact: "Named with a number", target: ["row:4", "row:2", "row:5"] },
    ],
  },
  "cell reference": {
    learn: { visual: { grid: { cols: 5, rows: 6, sel: "C5", nameBox: true } }, note: "Across the top first, then down: like a grid reference on a map." },
    exercises: [
      { type: "gridClick", fact: "column letter first", target: ["C5", "B3", "E2", "D6", "A4"] },
      { type: "gridName", fact: "column letter first", target: ["D3", "B5", "E2", "C4", "A6"] },
      { type: "choice", fact: "Never 5C", prompt: "Column C, row 5. Which is the right way to write it?", correct: "C5", wrong: ["5C", "C-5", "5:C"] },
    ],
  },
  // ------------------------------------------------------- level 2
  range: {
    learn: { visual: { grid: { cols: 5, rows: 7, sel: "C2:C7", nameBox: true } }, note: "Say it as “C2 to C7”." },
    exercises: [
      { type: "gridRange", fact: "first cell : last cell", target: ["C2:C6", "B2:B5", "B3:E3", "A2:D2"] },
      { type: "rangeName", fact: "first cell : last cell", target: ["B2:B6", "B4:E4", "C2:C5", "A3:D3"] },
      { type: "choice", fact: "The colon means \"to\"", prompt: "In C2:C7, what does the colon ( : ) mean?",
        correct: "“to”: C2 to C7, and every cell between", wrong: ["“and”: just C2 and C7", "“times”: C2 × C7", "“minus”: C2 − C7"] },
    ],
  },
  "Name Box": {
    learn: { visual: { image: "sheets-basic", highlight: "nameBox" }, note: "Type E2 in the Name Box, press Enter, and you jump straight to E2." },
    exercises: [
      { type: "hotspot", fact: "top-left", screen: "sheets-basic", target: "nameBox", prompt: "Tap the Name Box." },
      { type: "order", fact: "press Enter to jump there", prompt: "Put the steps in order to jump to cell E2.",
        steps: ["Click in the Name Box", "Type E2", "Press Enter"] },
      { type: "keys", fact: "press Enter", prompt: "You typed F10 in the Name Box. Press the key that jumps there!", combo: "enter", label: "Enter", wrong: ["Delete", "Ctrl + Z", "Space"],
        scene: { grid: { cols: 5, rows: 4, sel: "B2", nameBox: "F10" } } },
    ],
  },
  "fill handle": {
    learn: { visual: { image: "fill-handle" }, note: "In Google Sheets it is a small blue circle. Excel and LibreOffice use a small square." },
    exercises: [
      { type: "hotspot", fact: "bottom-right corner", screen: "sheets-basic", target: "fillHandle", prompt: "Tap the fill handle." },
      { type: "gridClick", fact: "bottom-right corner", target: "handle", prompt: "Grab the fill handle of the selected cell.", grid: { cols: 5, rows: 5, sel: "B2", cells: { B2: 5 } } },
      { type: "choice", fact: "a circle in Google Sheets", prompt: "What does the fill handle look like in Google Sheets?",
        correct: "A small circle", wrong: ["A small triangle", "A plus sign at the top-left", "A paint bucket"] },
    ],
  },
  "fill to copy": {
    learn: { visual: { fillDemo: { start: [5], end: 5 } }, note: "One cell selected → the same value, again and again." },
    exercises: [
      { type: "fill", fact: "the same value repeats", start: [7], end: 5 },
      { type: "fill", fact: "the same value repeats", start: ["Hall"], end: 5 },
      { type: "choice", fact: "Select one cell", prompt: "You want the same value in every cell. How many cells do you select before you drag the fill handle?",
        correct: "One cell", wrong: ["Two cells", "The whole column", "None"] },
    ],
  },
  "fill a pattern": {
    learn: { visual: { fillDemo: { start: [5, 10], end: 6 } }, note: "Two cells selected → it works out the pattern and keeps it going." },
    exercises: [
      { type: "fill", fact: "Select two cells", start: [5, 10], end: 6 },
      { type: "fill", fact: "Select two cells", start: [10, 20], end: 6 },
      { type: "fill", fact: "continue in the same way", start: [1, 2], end: 7 },
      { type: "order", fact: "Select two cells", prompt: "Put the steps in order to fill 5, 10, 15, 20… down column C.",
        steps: ["Type 5 in C1 and 10 in C2", "Select C1 and C2", "Drag the fill handle down"] },
    ],
  },
  // ------------------------------------------------------- level 3
  "move cells": {
    learn: { visual: { moveDemo: { from: "B2", to: "D4", value: "hello" } }, note: "The edge, not the fill handle: the fill handle fills, the edge moves." },
    exercises: [
      { type: "gridMove", fact: "drag it to a new place", from: ["B2", "B3", "C2"], to: ["D4", "E5", "D2"], value: ["hello", "42", "Pen"] },
      { type: "choice", fact: "hover the edge", prompt: "You want to move a cell. Where do you hover first?",
        correct: "Its edge, until the cursor is a hand", wrong: ["Its fill handle", "The Name Box", "The column letter"] },
      { type: "order", fact: "hover the edge", prompt: "Put the steps in order to move a cell.",
        steps: ["Select the cell", "Hover the edge until the cursor is a hand", "Drag it to the new place"] },
    ],
  },
  "clear cell contents": {
    learn: { visual: { keys: ["Delete"] }, note: "On a Chromebook, Backspace clears a cell too." },
    exercises: [
      { type: "keys", fact: "press Delete", prompt: "B2 is selected. Clear what's in it!", combo: "delete", label: "Delete", wrong: ["Ctrl + Y", "Enter", "Ctrl + Z"],
        scene: { grid: { cols: 4, rows: 4, sel: "B2", cells: { B2: 42 } }, after: { cells: { B2: "" } } } },
      { type: "choice", fact: "not any formatting", prompt: "B2 holds 42 and has a green fill. You click it and press Delete. What is left?",
        visual: { grid: { cols: 4, rows: 3, sel: "B2", cells: { B2: 42 }, style: { B2: { bg: "#b7e1c5" } } } },
        correct: "An empty cell that still has its green fill", wrong: ["An empty white cell: the fill is gone too", "42 is still there", "The cell is deleted and C2 moves into its place"] },
    ],
  },
  undo: {
    learn: { visual: { keys: ["Ctrl", "Z"] }, note: "Your safety net: you can't break anything." },
    exercises: [
      { type: "keys", fact: "Ctrl + Z", prompt: "Oops! You cleared 42 from B2 by mistake. Undo it!", combo: "ctrl+z", label: "Ctrl + Z", wrong: ["Ctrl + Y", "Ctrl + X", "Ctrl + U"],
        scene: { grid: { cols: 4, rows: 4, sel: "B2", cells: { B2: "" } }, after: { cells: { B2: 42 } } } },
      { type: "choice", fact: "Press it again to go further back", prompt: "You made three mistakes in a row. Ctrl + Z took back the last one. How do you take back the other two?",
        correct: "Press Ctrl + Z two more times", wrong: ["Press Ctrl + Y two more times", "You can't: Ctrl + Z only works once", "Close the spreadsheet and open it again"] },
    ],
  },
  redo: {
    learn: { visual: { keys: ["Ctrl", "Y"] }, note: "Ctrl + Z goes back. Ctrl + Y comes forward again." },
    exercises: [
      { type: "keys", fact: "Ctrl + Y", prompt: "You pressed Ctrl + Z one time too many and 42 disappeared. Bring it back!", combo: "ctrl+y", label: "Ctrl + Y", wrong: ["Ctrl + Z", "Ctrl + B", "Delete"],
        scene: { grid: { cols: 4, rows: 4, sel: "B2", cells: { B2: "" } }, after: { cells: { B2: 42 } } } },
      { type: "choice", fact: "bring back what Ctrl + Z just took away", prompt: "What does Ctrl + Y do?",
        correct: "Brings back what Ctrl + Z just took away", wrong: ["Takes back your last action", "Clears the selected cell", "Copies the cell"] },
    ],
  },
  // ------------------------------------------------------- level 4
  "select, then apply": {
    learn: { visual: { steps: ["Select the cells", "Choose a tool"] }, note: "Nothing changes until the cells are selected." },
    exercises: [
      { type: "gridRange", fact: "Select the cells first", target: ["A1:D1"], prompt: "You want to make the headings bold. Do the first step: select A1:D1.", grid: { cols: 4, rows: 3, cells: shop } },
      { type: "choice", fact: "only works on selected cells", prompt: "Mia clicks Bold, but nothing in her table changes. What went wrong?",
        correct: "She didn't select any cells first", wrong: ["Bold only works on numbers", "She needed to press Delete first", "She should have used fill colour"] },
      { type: "order", fact: "Select the cells first, then choose a tool", prompt: "Put the steps in order to make A1:D1 bold.",
        steps: ["Click A1", "Drag across to D1", "Click Bold"] },
    ],
  },
  "text formatting": {
    learn: { visual: { icons: [["ic-fontfamily", "Font"], ["ic-fontsize", "Size"], ["ic-bold", "Bold"], ["ic-fontcolour", "Font colour"]] } },
    exercises: [
      { type: "choice", fact: "Changing the writing itself", prompt: "Which one is NOT text formatting?",
        correct: "Fill colour: the cell's background", wrong: ["Bold", "Font size", "Font colour"] },
      { type: "hotspot", fact: "bold", screen: "sheets-basic", target: "bold", prompt: "Tap the Bold button." },
      { type: "hotspot", fact: "colour", screen: "sheets-basic", target: "fontColour", prompt: "Tap the button that changes the colour of the writing." },
    ],
  },
  "fill colour": {
    learn: { visual: { icons: [["ic-fill", "Fill colour"]], grid: { cols: 4, rows: 2, cells: { A1: "Item", B1: "Price", C1: "Qty", D1: "Total" }, style: { A1: { bg: "#137a3c", color: "#fff", b: 1 }, B1: { bg: "#137a3c", color: "#fff", b: 1 }, C1: { bg: "#137a3c", color: "#fff", b: 1 }, D1: { bg: "#137a3c", color: "#fff", b: 1 } } } } },
    exercises: [
      { type: "hotspot", fact: "paint bucket", screen: "sheets-ribbon", target: "fillColour", prompt: "Tap the fill colour button." },
      { type: "choice", fact: "background colour", prompt: "What does fill colour change?",
        correct: "The background of the selected cells", wrong: ["The colour of the writing", "The lines around the cells", "The colour of the sheet tab"] },
    ],
  },
  borders: {
    learn: { visual: { image: "border-menu" }, note: "Where · Colour (the pencil) · Thickness. A thick red box: red → thick → outer box." },
    exercises: [
      { type: "choice", fact: "where", prompt: "The borders menu lets you set three things. Which three?",
        correct: "Where, colour and thickness", wrong: ["Font, size and bold", "Width, height and wrap", "Where, size and font"] },
      { type: "hotspot", fact: "outer box", screen: "border-menu", target: "outer", prompt: "Tap the button for a box around the outside only." },
      { type: "hotspot", fact: "colour (the pencil)", screen: "border-menu", target: "colour", prompt: "Tap where you choose the border's colour." },
    ],
  },
  // ------------------------------------------------------- level 5
  sheet: {
    learn: { visual: { tabs: { tabs: ["Sheet1", "Sheet2", "Sheet3"], active: 0 } }, note: "Like the pages in a ring binder: one file, many pages." },
    exercises: [
      { type: "choice", fact: "The whole file is the spreadsheet", prompt: "Which pair is right? The whole file is the (1) ____. Each tab is a (2) ____.",
        visual: { tabs: { tabs: ["Sheet1", "Sheet2", "Sheet3"], active: 0 } },
        correct: "spreadsheet · sheet", wrong: ["sheet · spreadsheet", "cell · range", "range · column"] },
      { type: "choice", fact: "worksheet", prompt: "What is another name for a sheet?", correct: "A worksheet", wrong: ["A cell", "A range", "A Name Box"] },
    ],
  },
  "insert a sheet": {
    learn: { visual: { tabs: { tabs: ["Sheet1"], active: 0, highlight: "+" } } },
    exercises: [
      { type: "hotspot", fact: "Click the +", ui: { tabs: { tabs: ["Data", "Notes"], active: 0 } }, target: "+", prompt: "Add a new sheet." },
      { type: "choice", fact: "bottom-left", prompt: "Where is the + that adds a new sheet?", correct: "At the bottom-left", wrong: ["At the top-right", "In the Name Box", "In the Format menu"] },
    ],
  },
  "rename a sheet": {
    learn: { visual: { tabs: { tabs: ["Data", "Sheet2"], active: 1, editing: 1 } }, note: "Double-click Sheet2, type Data, press Enter." },
    exercises: [
      { type: "order", fact: "Double-click the tab", prompt: "Put the steps in order to rename Sheet1 to Data.",
        steps: ["Double-click the Sheet1 tab", "Type Data", "Press Enter"] },
      { type: "choice", fact: "Double-click the tab", prompt: "How do you start renaming a sheet?", correct: "Double-click its tab", wrong: ["Click the +", "Select A1 and type", "Press Delete"] },
    ],
  },
  "duplicate a sheet": {
    learn: { visual: { tabmenu: { tab: "Data", highlight: "Duplicate" } }, note: "Two-finger tap on a Chromebook = right-click." },
    exercises: [
      { type: "hotspot", fact: "Duplicate", ui: { tabmenu: { tab: "Term 1" } }, target: "Duplicate", prompt: "Make a copy of the Term 1 sheet." },
      { type: "choice", fact: "Makes a copy", prompt: "What does Duplicate do to a sheet?", correct: "Makes a copy of it", wrong: ["Deletes it", "Moves it to the right", "Renames it"] },
    ],
  },
  "move a sheet": {
    learn: { visual: { tabs: { tabs: ["Notes", "Data"], active: 1, dragging: 1 } }, note: "Drag a tab along the row, or use Move right / Move left in the tab menu." },
    exercises: [
      { type: "hotspot", fact: "Move right", ui: { tabmenu: { tab: "Notes" } }, target: "Move right", prompt: "Move the Notes sheet one place to the right." },
      { type: "choice", fact: "Drag the tab", prompt: "Which of these moves a sheet tab to a new place?",
        correct: "Drag the tab along the row", wrong: ["Double-click the tab", "Click the +", "Press Ctrl + Y"] },
    ],
  },
  "colour a sheet tab": {
    learn: { visual: { tabs: { tabs: ["Data", "Notes"], active: 0, colours: ["#1f9a4f", "#fbbc04"] } } },
    exercises: [
      { type: "hotspot", fact: "Change colour", ui: { tabmenu: { tab: "Data" } }, target: "Change colour", prompt: "Make the Data tab green. What do you choose?" },
    ],
  },
  // ======================================================= Lesson 2
  "column width": {
    learn: { visual: { grid: { cols: 3, rows: 2, widths: { A: 0.7, B: 1.3 }, cells: { A1: "Stall", B1: "Date", A2: "Face Painting", B2: "12 Nov" } }, colheads: { n: 3, highlight: "A|B" } },
      note: "Column A is too narrow: “Face Painting” is cut off. Drag the line between A and B to the right, or double-click it." },
    exercises: [
      { type: "choice", fact: "Drag the line between two column letters", prompt: "You drag the line between columns B and C to the right. Which column gets wider?",
        visual: { colheads: { n: 4, highlight: "B|C" } }, correct: "Column B", wrong: ["Column C", "Both B and C", "Neither: row 1 gets taller"] },
      { type: "hotspot", fact: "Drag the line between two column letters", ui: { colheads: { n: 4 } }, target: "B|C", prompt: "Tap the line you'd drag to make column B wider." },
      { type: "choice", fact: "Double-click it to fit the widest cell automatically", prompt: "What happens when you double-click the line between two column letters?",
        correct: "The column fits its widest cell automatically", wrong: ["The column is deleted", "A new column is inserted", "The column is selected"] },
    ],
  },
  "row height": {
    learn: { visual: { grid: { cols: 3, rows: 3, heights: { 2: 58 }, cells: { A1: "Stall", A2: "Raffle" } }, rowheads: { n: 3, highlight: "2|3" } }, note: "The same trick as columns, on the line under a row number." },
    exercises: [
      { type: "hotspot", fact: "Drag the line between two row numbers", ui: { rowheads: { n: 4 } }, target: "2|3", prompt: "Tap the line you'd drag to make row 2 taller." },
      { type: "choice", fact: "Drag the line between two row numbers", prompt: "How do you make a row taller?",
        correct: "Drag the line under its row number down", wrong: ["Drag the line between two column letters", "Press Enter in the row", "Merge the row's cells"] },
    ],
  },
  "vertical alignment": {
    learn: { visual: { grid: { cols: 3, rows: 1, heights: { 1: 72 }, cells: { A1: "Top", B1: "Middle", C1: "Bottom" }, style: { A1: { valign: "top" }, B1: { valign: "middle" } } } }, note: "Bottom is the default. You only notice it when a row is taller than its text." },
    exercises: [
      { type: "choice", fact: "Bottom is the default", prompt: "Row 1 is now three lines tall. Nobody has touched vertical alignment. Where does the word sit?",
        visual: { grid: { cols: 3, rows: 2, heights: { 1: 78 }, cells: { A1: "Stall" }, sel: "A1", handle: false } }, correct: "At the bottom", wrong: ["At the top", "In the middle", "It stretches to fill the cell"] },
      { type: "choice", fact: "top, middle, or bottom", prompt: "Which cell is set to Middle?",
        visual: { grid: { cols: 3, rows: 1, heights: { 1: 72 }, cells: { A1: "Aa", B1: "Aa", C1: "Aa" }, style: { A1: { valign: "middle" }, B1: { valign: "top" } } } }, correct: "A1", wrong: ["B1", "C1", "None of them"] },
      { type: "hotspot", fact: "top, middle, or bottom", screen: "sheets-ribbon", target: "vAlign", prompt: "Tap the vertical align button." },
    ],
  },
  "text wrap": {
    learn: { visual: { grid: { cols: 3, rows: 3, heights: { 2: "auto" }, widths: { A: 1.1 }, cells: { A1: "Face Painting today", A2: "Face Painting today", A3: "Face Painting today", B3: "Hall" }, style: { A2: { wrap: "wrap" }, A3: { wrap: "clip" } } } },
      note: "Row 1: overflow (the default) spills into B1. Row 2: wrap grows the row. Row 3: clip cuts it off at the edge." },
    exercises: [
      { type: "choice", fact: "grow the row to fit it all", prompt: "A cell is set to Wrap and its text is longer than the column. What happens?",
        correct: "The row grows taller to fit all the text", wrong: ["The text spills into the next cell", "The text is cut off at the edge", "The column gets wider"] },
      { type: "choice", fact: "cut it off at the edge", prompt: "A1 is set to Clip. What happens to the end of the text?",
        visual: { grid: { cols: 3, rows: 2, widths: { A: 1.1 }, cells: { A1: "Face Painting today" }, style: { A1: { wrap: "clip" } }, sel: "A1", handle: false } },
        correct: "It's cut off at the cell's edge (still there, just hidden)", wrong: ["It's deleted", "It spills into B1", "The row grows to fit it"] },
      { type: "choice", fact: "spill into an empty cell next door (the default)", prompt: "Nobody changed the text wrapping and B1 is empty. What does the long text in A1 do?",
        visual: { grid: { cols: 3, rows: 2, widths: { A: 1.1 }, cells: { A1: "Face Painting today" } } },
        correct: "It spills into the empty cell next door", wrong: ["It wraps onto a second line", "It's cut off at the edge", "It shrinks to fit"] },
      { type: "hotspot", fact: "three choices on one toolbar button", screen: "sheets-ribbon", target: "wrap", prompt: "Tap the text wrapping button." },
    ],
  },
  "merge cells": {
    learn: { visual: { grid: { cols: 4, rows: 3, merges: ["A1:D1"], cells: { A1: "Fair Stalls", A2: "Stall", B2: "Date", C2: "Location", D2: "Notes" }, style: { A1: { b: 1, align: "center" }, A2: { b: 1 }, B2: { b: 1 }, C2: { b: 1 }, D2: { b: 1 } } }, image: "merge-button" },
      note: "The merge button stays grey until you select two or more cells." },
    exercises: [
      { type: "choice", fact: "the whole selection becomes one cell", prompt: "You select A1:E1 and choose Merge all. How many cells is A1:E1 now?", correct: "One", wrong: ["Five", "Two", "None: they're deleted"] },
      { type: "order", fact: "then centre it", prompt: "Put the steps in order to make a heading across A1:D1.",
        steps: ["Select A1:D1", "Click the merge button", "Choose Merge all", "Centre it"] },
      { type: "hotspot", fact: "merge button", screen: "sheets-ribbon", target: "merge", prompt: "Tap the merge cells button." },
      { type: "gridRange", fact: "Select two or more cells", target: ["A1:D1"], prompt: "Select the cells to merge for a heading across the table: A1:D1.",
        grid: { cols: 4, rows: 3, cells: { A1: "Fair Stalls", A2: "Stall", B2: "Date", C2: "Location", D2: "Notes" } } },
    ],
  },
  "horizontal alignment": {
    learn: { visual: { grid: { cols: 3, rows: 2, cells: { A1: "Stall", B1: "Stall", C1: "Stall", A2: "Left", B2: "Centre", C2: 42 }, style: { B1: { align: "center" }, C1: { align: "right" }, B2: { align: "center" } } } }, note: "Text sits on the left, numbers on the right, until you change it." },
    exercises: [
      { type: "choice", fact: "numbers default to the right", prompt: "You type the number 42 into a cell. Nobody changed the alignment. Where does it sit?", correct: "On the right", wrong: ["On the left", "In the centre", "At the top"] },
      { type: "choice", fact: "Text defaults to the left", prompt: "Nobody changed the alignment. Where does the word “Raffle” sit in its cell?", correct: "On the left", wrong: ["On the right", "In the centre", "It depends on the font"] },
      { type: "hotspot", fact: "left, centre, or right", screen: "sheets-ribbon", target: "hAlign", prompt: "Tap the horizontal align button." },
    ],
  },
  locale: {
    learn: { visual: { grid: { cols: 2, rows: 2, widths: { A: 1.2 }, cells: { A1: "Locale", B1: "03/04/2026 is…", A2: "Australia", B2: "3 April 2026" }, style: { A1: { b: 1 }, B1: { b: 1 } } } }, note: "In the United States, 03/04/2026 is March 4. Set the locale (File → Settings) before you type dates." },
    exercises: [
      { type: "choice", fact: "day-first vs month-first", prompt: "The locale is Australia. You type 03/04/2026. Which date is it?", correct: "3 April 2026", wrong: ["4 March 2026", "3 March 2026", "4 April 2026"] },
      { type: "choice", fact: "File → Settings", prompt: "Where do you change a spreadsheet's locale?", correct: "File → Settings", wrong: ["Format → Number", "View → Freeze", "Format → Conditional formatting"] },
      { type: "choice", fact: "controls how dates, currency, and numbers are read and written", prompt: "What does the locale control?",
        correct: "How dates, currency and numbers are read and written", wrong: ["The font and its size", "How wide the columns are", "Which sheets you can see"] },
    ],
  },
  "format vs value": {
    learn: { visual: { grid: { cols: 3, rows: 2, cells: { A1: "Item", B1: "Cost", A2: "Pen", B2: "$7.50" }, style: { B2: { align: "right" } }, sel: "B2", nameBox: true, formula: "7.5" } }, note: "The cell shows $7.50, but the formula bar shows what it really holds: 7.5." },
    exercises: [
      { type: "choice", fact: "never changes what the cell actually holds", prompt: "B2 shows $7.50. What does B2 actually hold?",
        visual: { grid: { cols: 3, rows: 2, cells: { A1: "Item", B1: "Cost", A2: "Pen", B2: "$7.50" }, style: { B2: { align: "right" } }, sel: "B2", nameBox: true, formula: "?" } },
        correct: "7.5", wrong: ["$7.50", "7.50 $", "The text “$7.50”"] },
      { type: "choice", fact: "never changes what the cell actually holds", prompt: "A cell holds 18. You apply Currency format. Has the cell's value changed?",
        correct: "No: it shows $18.00 but still holds 18", wrong: ["Yes: it now holds $18.00", "Yes: it now holds 18.00", "Yes: the 18 is replaced with text"] },
    ],
  },
  "date format": {
    learn: { visual: { grid: { cols: 2, rows: 2, widths: { B: 1.6 }, cells: { A1: "Typed", B1: "Custom date with the day name", A2: "9/11/2026", B2: "Mon, 9 Nov 2026" }, style: { A1: { b: 1 }, B1: { b: 1 }, A2: { align: "right" }, B2: { align: "right" } } } }, note: "Format → Number → Date for a clean date. Custom date and time for the day name in front." },
    exercises: [
      { type: "choice", fact: "Custom date and time to include things like the day name", prompt: "You want “Mon, 9 Nov 2026”, with the day name. Which do you choose?",
        correct: "Format → Number → Custom date and time", wrong: ["Format → Number → Date", "Format → Number → Currency", "File → Settings"] },
      { type: "choice", fact: "day name", prompt: "The locale is Australia. A cell holds 9/11/2026. You apply a custom format with the day name in front. What appears?",
        correct: "Mon, 9 Nov 2026", wrong: ["Fri, 11 Sep 2026", "9/11/2026 Monday", "Monday"] },
      { type: "order", fact: "Custom date and time", prompt: "Put the steps in order to show the day name in front of some dates.",
        steps: ["Select the date cells", "Open Format → Number", "Choose Custom date and time", "Pick a pattern with the day name"] },
    ],
  },
  "currency format": {
    learn: { visual: { grid: { cols: 2, rows: 2, cells: { A1: "Typed", B1: "Currency", A2: 18, B2: "$18.00" }, style: { A1: { b: 1 }, B1: { b: 1 }, B2: { align: "right" } } } }, note: "Never type the $ yourself: the format adds it." },
    exercises: [
      { type: "choice", fact: "two decimal places", prompt: "A cell holds 18. You apply Currency format. What do you see?", correct: "$18.00", wrong: ["18", "$18", "18.00 $"] },
      { type: "choice", fact: "Adds the $ sign", prompt: "After applying Currency format, do you need to type the $ sign yourself?", correct: "No: Currency format adds it automatically", wrong: ["Yes, before the number", "Yes, after the number", "Only for whole numbers"] },
      { type: "choice", fact: "Format → Number → Currency", prompt: "Where is the Currency format?", correct: "Format → Number → Currency", wrong: ["File → Settings → Currency", "View → Currency", "Insert → Currency"] },
    ],
  },
  "insert row/column": {
    learn: { visual: { grid: { cols: 3, rows: 5, cells: { A1: "Name", B1: "Stall", A2: "Priya", A3: "Jordan", A5: "Sam" }, style: { A4: { bg: "#d3e3fd" }, B4: { bg: "#d3e3fd" }, C4: { bg: "#d3e3fd" }, A1: { b: 1 }, B1: { b: 1 } } } }, note: "A new row was inserted above Sam: Sam moved down from row 4 to row 5. Nothing was overwritten." },
    exercises: [
      { type: "choice", fact: "Everything shifts to make room", prompt: "Your data is in rows 2 to 5. You right-click row 4 and choose Insert row above. Which row is the old row 4 in now?", correct: "Row 5", wrong: ["Row 4", "Row 3", "It's gone: the new row replaced it"] },
      { type: "gridClick", fact: "Right-click a row number", target: "row:3", prompt: "You want a new row above row 3. Which do you right-click? Click it." },
      { type: "choice", fact: "nothing is overwritten", prompt: "You insert a column in the middle of your table. What happens to the data?", correct: "It shifts across to make room: nothing is overwritten", wrong: ["The column there is overwritten", "The data is deleted", "The table is split into two sheets"] },
      { type: "choice", fact: "Insert column left/right", prompt: "You right-click column D and choose Insert 1 column left. Where does the new column appear?", correct: "On the left of the old column D", wrong: ["On the right of column D", "At the end of the sheet", "In a new sheet"] },
    ],
  },
  "freeze panes": {
    learn: { visual: { grid: { cols: 3, rows: 4, frozen: 1, rowLabels: [1, 14, 15, 16], cells: { A1: "Name", B1: "Stall", C1: "Hours", A2: "Leo", B2: "Cake Stall", C2: 3, A3: "Mia", B3: "Raffle", C3: 2, A4: "Sam", B4: "Photo Booth", C4: 4 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 } } } }, note: "Scrolled down to row 14, and the headers in row 1 are still there." },
    exercises: [
      { type: "choice", fact: "stay visible at the top", prompt: "Row 1 is frozen. You scroll far down the sheet. What stays visible at the top?", correct: "Row 1, the headers", wrong: ["Nothing: everything scrolls", "The last row", "Column A"] },
      { type: "choice", fact: "View → Freeze", prompt: "Which menu freezes rows?", correct: "View → Freeze", wrong: ["Format → Freeze", "File → Settings", "Insert → Freeze"] },
    ],
  },
  "conditional formatting": {
    learn: { visual: { grid: { cols: 2, rows: 5, cells: { A1: "Name", B1: "Hours", A2: "Priya", B2: 2, A3: "Jordan", B3: 3, A4: "Sam", B4: 4, A5: "Mia", B5: 2 }, style: { A1: { b: 1 }, B1: { b: 1 }, B3: { bg: "#b7e1c5" }, B4: { bg: "#b7e1c5" } } } }, note: "The rule: Hours of 3 or more → green. Change Mia's 2 to a 3 and it turns green by itself." },
    exercises: [
      { type: "choice", fact: "keeps checking itself as values change", prompt: "The rule is “3 or more → green”. A cell holds 2, so it isn't green. Later you type 3 into it. What happens?",
        correct: "It turns green by itself", wrong: ["Nothing until you apply the rule again", "It turns red", "The rule is deleted"] },
      { type: "choice", fact: "applies formatting automatically whenever it is true", prompt: "The rule is “3 or more → green”. Which values turn green?",
        visual: { grid: { cols: 2, rows: 5, cells: { A1: "Name", B1: "Hours", A2: "Priya", B2: 2, A3: "Jordan", B3: 3, A4: "Sam", B4: 5, A5: "Mia", B5: 1 }, style: { A1: { b: 1 }, B1: { b: 1 } } } },
        correct: "3 and 5", wrong: ["Only 5", "2, 3 and 5", "All of them"] },
      { type: "choice", fact: "Format → Conditional formatting", prompt: "Where do you set up conditional formatting?", correct: "Format → Conditional formatting", wrong: ["View → Conditional formatting", "File → Settings", "Data → Freeze"] },
    ],
  },
  // ======================================================= Lesson 3
  formula: {
    learn: { visual: { grid: { cols: 4, rows: 3, cells: { A1: "Item", B1: "Cost each", C1: "Qty", D1: "Total", A2: "Balloons", B2: 3, C2: 20, D2: 60 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 } }, sel: "D2", nameBox: true, formula: "=B2*C2" } },
      note: "The cell shows the answer (60). The bar above the grid shows the formula: =B2*C2." },
    exercises: [
      { type: "choice", fact: "It always starts with =", prompt: "Which one is a formula?", correct: "=B2*C2", wrong: ["B2*C2", "B2 times C2", "D2"] },
      { type: "choice", fact: "Leave out the = and it is just text", prompt: "You type B2*C2 into D2, with no = at the start. What does D2 show?", correct: "The words B2*C2, as text", wrong: ["The answer, 60", "An error message", "0"] },
      { type: "choice", fact: "the bar above the grid shows the formula itself", prompt: "D2 shows 60. Where can you see the formula that worked it out?",
        visual: { grid: { cols: 4, rows: 2, cells: { A1: "Item", B1: "Cost each", C1: "Qty", D1: "Total", A2: "Balloons", B2: 3, C2: 20, D2: 60 }, sel: "D2", nameBox: true, formula: "" } },
        correct: "In the bar above the grid, after clicking D2", wrong: ["Nowhere: only the answer is kept", "In the Name Box", "In the sheet tab"] },
      { type: "formula", fact: "It always starts with =", prompt: "In D2, work out the total for the balloons: cost each (B2) times quantity (C2).", accept: ["=B2*C2", "=C2*B2"],
        visual: { grid: { cols: 4, rows: 2, cells: { A1: "Item", B1: "Cost each", C1: "Qty", D1: "Total", A2: "Balloons", B2: 3, C2: 20 }, sel: "D2" } } },
    ],
  },
  operators: {
    learn: { visual: { keys: ["+", "−", "*", "/"] }, note: "* is Shift + 8. / is the key beside the right Shift. Never x or ÷." },
    exercises: [
      { type: "choice", fact: "* multiply", prompt: "Which sign multiplies in a spreadsheet?", correct: "*", wrong: ["x", "×", "÷"] },
      { type: "choice", fact: "/ divide", prompt: "Which sign divides in a spreadsheet?", correct: "/", wrong: ["÷", ":", "\\"] },
      { type: "choice", fact: "Shift + 8", prompt: "Which keys type the * sign?", correct: "Shift + 8", wrong: ["Shift + X", "Ctrl + 8", "Alt + 8"] },
      { type: "choice", fact: "* multiply", prompt: "A1 holds 6 and B1 holds 4. What does =A1*B1 show?", visual: { grid: { cols: 3, rows: 1, cells: { A1: 6, B1: 4, C1: "=A1*B1" } } }, correct: "24", wrong: ["10", "2", "64"] },
      { type: "choice", fact: "/ divide", prompt: "A1 holds 6 and B1 holds 4. What does =A1/B1 show?", visual: { grid: { cols: 3, rows: 1, cells: { A1: 6, B1: 4, C1: "=A1/B1" } } }, correct: "1.5", wrong: ["24", "2", "0.67"] },
      { type: "formula", fact: "Never x", prompt: "40 stickers are in F5, shared between the helpers in F6. Write the formula for how many each.", accept: ["=F5/F6"] },
    ],
  },
  "why use a cell reference": {
    learn: { visual: { grid: { cols: 4, rows: 3, widths: { C: 1.2, D: 1.2 }, cells: { A1: "Cost", B1: "Qty", C1: "=5*3", D1: "=A2*B2", A2: 6, B2: 3, C2: 15, D2: 18 }, style: { C1: { b: 1 }, D1: { b: 1 }, C2: { bg: "#fdece6" }, D2: { bg: "#e7f5ec" } } } },
      note: "The cost changed from 5 to 6. =5*3 still says 15. =A2*B2 updated to 18 by itself." },
    exercises: [
      { type: "choice", fact: "the answer updates by itself", prompt: "B2 holds 5 and C2 holds 3. D2 has =5*3 and E2 has =B2*C2. Then B2 changes to 6. What do D2 and E2 show now?",
        correct: "D2: 15 and E2: 18", wrong: ["Both show 18", "Both still show 15", "D2: 18 and E2: 15"] },
      { type: "choice", fact: "Point the calculation at a cell", prompt: "Goal: multiply B2 by C2 (B2 holds 5, C2 holds 3). Which formula is right?", correct: "=B2*C2", wrong: ["B2*C2", "=B2xC2", "=5*3"] },
      { type: "formula", fact: "Point the calculation at a cell", prompt: "Money raised is in F2 and money spent is in F3. In F4, work out what's left.", accept: ["=F2-F3"] },
    ],
  },
  "click to add a reference": {
    learn: { visual: { steps: ["Type =", "Click B2", "Type *", "Click C2", "Enter"] }, note: "Each reference goes in for you, in the same colour as the cell it points to." },
    exercises: [
      { type: "order", fact: "click a cell instead of typing its name", prompt: "Put the steps in order to make =B2*C2 by clicking.", steps: ["Type =", "Click B2", "Type *", "Click C2", "Press Enter"] },
      { type: "choice", fact: "Fewer typos", prompt: "Why click a cell instead of typing its name into a formula?", correct: "Its name goes in for you, so there are fewer typos", wrong: ["Clicking makes the answer bigger", "Typed names don't work", "Clicking adds the = for you"] },
      { type: "choice", fact: "coloured to match the cell", prompt: "You clicked B2 while typing a formula. How can you tell which cell B2 is?", correct: "B2 in the formula is coloured to match the cell", wrong: ["B2 turns bold", "B2 flashes red", "You can't tell"] },
    ],
  },
  "fill a formula": {
    learn: { visual: { grid: { cols: 4, rows: 5, widths: { D: 1.3 }, cells: { A1: "Item", B1: "Cost", C1: "Qty", D1: "Total", D2: "=B2*C2", D3: "=B3*C3", D4: "=B4*C4", D5: "=B5*C5" }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 } }, sel: "D2:D5" } },
      note: "Dragged down from D2: each row's formula uses its own row." },
    exercises: [
      { type: "choice", fact: "its cell references move with it", prompt: "C2 holds =A2+B2. You fill it down to C5. What's in C5?", correct: "=A5+B5", wrong: ["=A2+B2", "=A5+B2", "=A3+B3"] },
      { type: "choice", fact: "its cell references move with it", prompt: "E3 holds =D3/2. You fill it down to E4. What's in E4?", correct: "=D4/2", wrong: ["=D4/3", "=D3/2", "=E4/2"] },
      { type: "formula", fact: "=B2*C2 becomes =B3*C3 on the next row", prompt: "D2 holds =B2*C2. You fill it down to D6. Type the formula that's now in D6.", accept: ["=B6*C6", "=C6*B6"] },
    ],
  },
  "show formulas": {
    learn: { visual: { keys: ["Ctrl", "`"], grid: { cols: 4, rows: 3, widths: { D: 1.3 }, cells: { B1: "Cost", C1: "Qty", D1: "Total", B2: 3, C2: 20, D2: "=B2*C2", B3: 4, C3: 15, D3: "=B3*C3" } } }, note: "The ` key is under Esc, top-left. Nothing changes in the cells: only what you see." },
    exercises: [
      { type: "keys", fact: "Ctrl + `", prompt: "Show every formula on the sheet, so you can check your work!", combo: "ctrl+`", label: "Ctrl + `", wrong: ["Ctrl + F", "Ctrl + Z", "Ctrl + Y"],
        scene: { grid: { cols: 4, rows: 3, widths: { D: 1.3 }, cells: { B1: "Cost", C1: "Qty", D1: "Total", B2: 3, C2: 20, D2: 60, B3: 4, C3: 15, D3: 60 } }, after: { cells: { D2: "=B2*C2", D3: "=B3*C3" } } } },
      { type: "choice", fact: "see every formula instead of its answer", prompt: "Formulas are showing. B2 has the number 12 typed in (no formula). What does B2 show?", correct: "12", wrong: ["=12", "=B2", "Nothing"] },
      { type: "choice", fact: "Press it again to go back", prompt: "Formulas are showing. How do you go back to the answers?", correct: "Press Ctrl + ` again", wrong: ["Press Ctrl + Z", "Close the spreadsheet", "Delete the formulas"] },
    ],
  },
  function: {
    learn: { visual: { grid: { cols: 2, rows: 5, cells: { A1: "Cost", A2: 60, A3: 60, A4: 36, A5: 80 }, style: { A1: { b: 1 } }, sel: "B5", nameBox: "B5", formula: "=SUM(A2:A5)" } }, note: "= first, then the name (SUM), then a range in brackets." },
    exercises: [
      { type: "choice", fact: "then the name", prompt: "In =SUM(D2:D9), which part is the function's name?", correct: "SUM", wrong: ["D2:D9", "=", "( )"] },
      { type: "choice", fact: "It still starts with =", prompt: "What does every function start with?", correct: "=", wrong: ["(", "SUM", "#"] },
      { type: "choice", fact: "then a range in brackets", prompt: "In a function, where does the range go?", correct: "In brackets after the name: SUM(D2:D9)", wrong: ["Before the =", "In the Name Box", "In a separate cell"] },
    ],
  },
  SUM: {
    learn: { visual: { grid: { cols: 4, rows: 4, cells: { A1: "Item", B1: "Cost", A2: "Balloons", B2: 90, A3: "Cups", B3: 60, A4: "Total", B4: 150 }, style: { A4: { b: 1 }, B4: { b: 1 } }, sel: "B4", nameBox: true, formula: "=SUM(B2:B3)" } }, note: "Quickest way: type =SUM( then drag over the cells. Enter." },
    exercises: [
      { type: "formula", fact: "=SUM(first:last)", prompt: "Write a function that adds up B2 to B9.", accept: ["=SUM(B2:B9)"] },
      { type: "formula", fact: "across a row (C4:E4)", prompt: "Write a function that adds up C4, D4 and E4.", accept: ["=SUM(C4:E4)"] },
      { type: "choice", fact: "adds up every cell in a range", prompt: "B2, B3 and B4 hold 5, 10 and 20. What does =SUM(B2:B4) show?", visual: { grid: { cols: 3, rows: 4, cells: { B2: 5, B3: 10, B4: 20 } } }, correct: "35", wrong: ["3", "520", "25"] },
      { type: "choice", fact: "across a row (C4:E4)", prompt: "F4 holds =SUM(C4:E4). You fill it down to F7. What's in F7?", correct: "=SUM(C7:E7)", wrong: ["=SUM(C4:E4)", "=SUM(C4:E7)", "=SUM(F7)"] },
      { type: "gridRange", fact: "then drag over the cells", target: ["D2:D5"], prompt: "You've typed =SUM( into D6. Now drag over the costs: D2:D5.", grid: { cols: 4, rows: 6, cells: { D1: "Cost", D2: 60, D3: 60, D4: 36, D5: 80, D6: "=SUM(" } } },
    ],
  },
  "order when subtracting": {
    learn: { visual: { grid: { cols: 3, rows: 3, widths: { A: 1.4 }, cells: { A1: "Overall cost", B1: 236, A2: "Budget", B2: 250, A3: "Left over", B3: 14, C3: "=B2-B1" }, style: { A3: { b: 1 } } } }, note: "What you have first, then take away what you spend. −14 would mean the wrong way round." },
    exercises: [
      { type: "choice", fact: "Put what you have first, then take away what you spend", prompt: "The budget is in B8 (250). The overall cost is in B7 (236). Which formula shows the money left?", correct: "=B8-B7", wrong: ["=B7-B8", "=B8+B7", "=B7/B8"] },
      { type: "choice", fact: "A minus answer means over budget", prompt: "The budget in B8 is 200. The overall cost in B7 is 236. What does =B8-B7 show, and what does it mean?", correct: "−36: over budget", wrong: ["36: under budget", "−36: under budget", "436: over budget"] },
      { type: "formula", fact: "Put what you have first", prompt: "E2 is the money we have. E3 is what we spent. Write the formula for the money left.", accept: ["=E2-E3"] },
    ],
  },
  "paint format": {
    learn: { visual: { image: "sheets-basic", highlight: "paintFormat" }, note: "It copies the look (bold, size, colours, currency), never what's in the cell." },
    exercises: [
      { type: "hotspot", fact: "paint roller", screen: "sheets-basic", target: "paintFormat", prompt: "Tap the paint format button (the paint roller)." },
      { type: "order", fact: "click the cell that looks right", prompt: "Put the steps in order to copy D2's look onto D3:D9.", steps: ["Click D2, the cell that looks right", "Click the paint roller", "Drag over D3:D9"] },
      { type: "choice", fact: "not what is in the cell", prompt: "D2 is bold and in dollars. You paint format D2 onto D9, which holds 50. What's in D9 now?", correct: "Still 50: it just looks like $50.00, in bold", wrong: ["The same number as D2", "Nothing: it's cleared", "50 with no formatting"] },
    ],
  },
  // ======================================================= Lesson 4
  "relative reference": {
    learn: { visual: { grid: { cols: 3, rows: 4, widths: { C: 1.4 }, cells: { A1: "Cost", B1: "Qty", C1: "Total", A2: 3, B2: 20, C2: "=A2*B2", A3: 4, B3: 15, C3: "=A3*B3", A4: 2, B4: 30, C4: "=A4*B4" }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 } }, sel: "C2:C4" } },
      note: "Filled down from C2, with the formulas showing: every reference moves with the row. That's a relative reference." },
    exercises: [
      { type: "choice", fact: "it moves with the row", prompt: "C2 holds =A2*B2. You fill it down to C5. What's in C5?", correct: "=A5*B5", wrong: ["=A2*B2", "=A5*B2", "=A3*B3"] },
      { type: "choice", fact: "Every reference is this kind unless you lock it", prompt: "You type =A2*B2, with no $ signs. What kind of references are A2 and B2?", correct: "Relative: they move when you fill", wrong: ["Absolute: they stay the same when you fill", "Locked: they can't be changed", "Neither: only $ references have a kind"] },
      { type: "choice", fact: "it moves with the row", prompt: "B2 holds =A2*D1 and shows the right answer. You fill it down to B3. What's in B3?",
        visual: { grid: { cols: 4, rows: 3, widths: { B: 1.3 }, cells: { A1: "Total", B1: "Charity", C1: "Rate", D1: "10%", A2: 200, B2: "=A2*D1", A3: 150 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { align: "right" } }, sel: "B2" } },
        correct: "=A3*D2", wrong: ["=A3*D1", "=A2*D1", "=A3*$D$1"] },
      { type: "choice", fact: "it moves with the row", prompt: "B3 now holds =A3*D2, but the rate is in D1. D2 is empty. What does B3 show?",
        visual: { grid: { cols: 4, rows: 3, widths: { B: 1.3 }, cells: { A1: "Total", B1: "Charity", C1: "Rate", D1: "10%", A2: 200, B2: 20, A3: 150, B3: "?" }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { align: "right" } }, sel: "B3" } },
        correct: "0: it multiplies by an empty cell", wrong: ["15: 10% of 150", "20: the same as B2", "An error message"] },
      { type: "formula", fact: "=A2*B2 becomes =A3*B3", prompt: "D2 holds =B2*C2. You fill it down to D4. Type the formula that's now in D4.", accept: ["=B4*C4", "=C4*B4"] },
    ],
  },
  "percentage in a cell": {
    learn: { visual: { grid: { cols: 3, rows: 2, cells: { A1: "Rate", B1: "10%", A2: 200, B2: 20 }, style: { A1: { b: 1 }, B1: { align: "right" } }, sel: "B2", nameBox: true, formula: "=A2*B1" } },
      note: "B1 shows 10%, but the number it holds is 0.1. So =A2*B1 is 200 × 0.1 = 20: 10% of 200." },
    exercises: [
      { type: "choice", fact: "it holds 0.1", prompt: "You type 10% into B1. What number does B1 hold?", correct: "0.1", wrong: ["10", "1.0", "100"] },
      { type: "choice", fact: "it holds 0.1", prompt: "F1 shows 25%. What number does it hold?", visual: { grid: { cols: 6, rows: 1, cells: { E1: "Share", F1: "25%" }, style: { F1: { align: "right" } }, sel: "F1" } }, correct: "0.25", wrong: ["25", "2.5", "0.025"] },
      { type: "choice", fact: "=200*B1 gives 20", prompt: "B1 holds 10%. What does =200*B1 show?", correct: "20", wrong: ["2000", "210", "0.1"] },
      { type: "choice", fact: "Multiply by that cell to get 10% of a number", prompt: "B2 holds 300 and F1 holds 10%. What does =B2*F1 show?",
        visual: { grid: { cols: 6, rows: 2, cells: { B1: "Total", B2: 300, E1: "Rate", F1: "10%" }, style: { F1: { align: "right" } } } }, correct: "30", wrong: ["3000", "310", "3"] },
      { type: "choice", fact: "Multiply by that cell", prompt: "G1 holds 20% and C2 holds 50. What does =C2*G1 show?", correct: "10", wrong: ["1000", "70", "2.5"] },
      { type: "formula", fact: "Multiply by that cell", prompt: "A2 holds 200. B1 holds 10%. In C2, work out 10% of A2.", accept: ["=A2*B1", "=B1*A2"],
        visual: { grid: { cols: 3, rows: 2, cells: { A1: "Total", B1: "10%", A2: 200 }, style: { A1: { b: 1 }, B1: { align: "right" } }, sel: "C2" } } },
    ],
  },
  "absolute reference": {
    learn: { visual: { grid: { cols: 4, rows: 4, widths: { B: 1.5 }, cells: { A1: "Total", B1: "Charity", C1: "Rate", D1: "10%", A2: 200, B2: "=A2*$D$1", A3: 150, B3: "=A3*$D$1", A4: 80, B4: "=A4*$D$1" }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { align: "right", bg: "#e7f5ec" } }, sel: "B2:B4" } },
      note: "Filled down, with the formulas showing: A moves with the row, $D$1 never moves. Every row uses the rate in D1." },
    exercises: [
      { type: "choice", fact: "a $ before the letter AND the number", prompt: "Which one is an absolute (locked) reference?", correct: "$B$13", wrong: ["B13", "$B13", "B$13"] },
      { type: "choice", fact: "It stays the same when you fill", prompt: "C2 holds =B2*$F$1. You fill it down to C5. What's in C5?", correct: "=B5*$F$1", wrong: ["=B5*$F$4", "=B2*$F$1", "=B5*F5"] },
      { type: "choice", fact: "It stays the same when you fill", prompt: "B2 holds =A2*$D$1. You fill it down to B4. What does B4 show?",
        visual: { grid: { cols: 4, rows: 4, widths: { B: 1.3 }, cells: { A1: "Total", B1: "Charity", C1: "Rate", D1: "10%", A2: 200, B2: 20, A3: 150, B3: 15, A4: 80, B4: "?" }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { align: "right" } }, sel: "B4" } },
        correct: "8", wrong: ["0", "20", "80"] },
      { type: "choice", fact: "$ is Shift + 4", prompt: "Which keys type the $ sign?", correct: "Shift + 4", wrong: ["Shift + 8", "Ctrl + 4", "Alt + 4"] },
      { type: "lockRef", fact: "a $ before the letter AND the number", prompt: "Every row uses the rate in D1. Lock it, so it stays the same when you fill down.", formula: "=A2*D1", lock: ["D1"],
        visual: { grid: { cols: 4, rows: 3, widths: { B: 1.3 }, cells: { A1: "Total", B1: "Charity", C1: "Rate", D1: "10%", A2: 200, A3: 150 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { align: "right" } }, sel: "B2" } } },
      { type: "formula", fact: "It stays the same when you fill", prompt: "C2 holds =B2*$F$1. You fill it down to C5. Type the formula that's now in C5.", hint: "$F$1 is locked. B2 is not.", accept: ["=B5*$F$1", "=$F$1*B5"] },
    ],
  },
  "when to lock a reference": {
    learn: { visual: { grid: { cols: 3, rows: 5, widths: { A: 1.3 }, cells: { A1: "Ticket price", B1: 2, A3: "Class", B3: "Tickets", C3: "Money", A4: "7A", B4: 48, C4: "=B4*$B$1", A5: "7B", B5: 35, C5: "=B5*$B$1" }, style: { A3: { b: 1 }, B3: { b: 1 }, C3: { b: 1 }, B1: { bg: "#e7f5ec" } }, sel: "C4:C5" } },
      note: "Every row uses the same one cell, the price in B1, so it's locked. Change B1 and every answer updates." },
    exercises: [
      { type: "lockRef", fact: "When every row uses the same one cell", prompt: "C4 is tickets sold (B4) × the ticket price (B1). Lock the reference every row shares.", formula: "=B4*B1", lock: ["B1"],
        visual: { grid: { cols: 3, rows: 5, widths: { A: 1.3 }, cells: { A1: "Ticket price", B1: 2, A3: "Class", B3: "Tickets", C3: "Money", A4: "7A", B4: 48, A5: "7B", B5: 35 }, style: { A3: { b: 1 }, B3: { b: 1 }, C3: { b: 1 } }, sel: "C4" } } },
      { type: "lockRef", fact: "Lock it with $", prompt: "H4 works out each stall's charity share: its total (E4) × the charity rate (B10). Lock the right reference.", formula: "=E4*B10", lock: ["B10"] },
      { type: "choice", fact: "When every row uses the same one cell", prompt: "D5 holds =C5*B2. B2 is the class share (25%), and every row uses it. Which reference gets the $?", correct: "B2: every row uses the same share", wrong: ["C5: it's the first one", "Both of them", "Neither: $ is only for SUM"] },
      { type: "formula", fact: "Lock it with $", prompt: "Tickets sold are in B4. The ticket price is in B1, and every row uses it. In C4, write the formula so it still works when you fill it down.", hint: "Lock the price with $. On Windows: press F4. On a Chromebook: type $ (Shift + 4).", accept: ["=B4*$B$1", "=$B$1*B4"],
        visual: { grid: { cols: 3, rows: 4, widths: { A: 1.3 }, cells: { A1: "Ticket price", B1: 2, A3: "Class", B3: "Tickets", C3: "Money", A4: "7A", B4: 48 }, style: { A3: { b: 1 }, B3: { b: 1 }, C3: { b: 1 } }, sel: "C4" } } },
      { type: "choice", fact: "changing that one cell updates every answer", prompt: "H4:H8 all use $B$10, which holds 10%. You change B10 to 15%. What happens?", correct: "Every answer in H4:H8 updates by itself", wrong: ["Only H4 changes", "Nothing until you fill down again", "The formulas stop working"] },
      { type: "choice", fact: "a rate, a price, a budget", prompt: "You fill a formula down a list of stalls. Which one should be locked with $?", correct: "The charity rate, in one cell", wrong: ["Each stall's own total", "Each stall's own name", "The row the formula is in"] },
    ],
  },
  "delete a row or column": {
    learn: { visual: { grid: { cols: 3, rows: 5, cells: { A1: "Class", B1: "Tickets", A2: "7A", B2: 48, A3: "7B", B3: 35, A4: "7C", B4: 60, A5: "7D", B5: 22 }, style: { A1: { b: 1 }, B1: { b: 1 } }, sel: "4:4" } },
      note: "Right-click the row number 4 → Delete row: 7C is gone and 7D moves up. The Delete key would only empty the cells." },
    exercises: [
      { type: "choice", fact: "The Delete key alone only empties the cells", prompt: "Which one removes row 6 completely?", correct: "Right-click the 6 → Delete row", wrong: ["Click row 6 and press the Delete key", "Right-click the 6 → Insert 1 row above", "Press Ctrl + Z"] },
      { type: "gridClick", fact: "Right-click (two-finger tap) the row number", target: "row:4", prompt: "To delete a whole row, you right-click its row number. Tap the row number for 7C.",
        grid: { cols: 3, rows: 5, cells: { A1: "Class", B1: "Tickets", A2: "7A", B2: 48, A3: "7B", B3: 35, A4: "7C", B4: 60, A5: "7D", B5: 22 } } },
      { type: "choice", fact: "Everything below moves up", prompt: "You delete row 3 (7B). What's in A3 now?",
        visual: { grid: { cols: 3, rows: 5, cells: { A1: "Class", B1: "Tickets", A2: "7A", B2: 48, A3: "7B", B3: 35, A4: "7C", B4: 60, A5: "7D", B5: 22 }, style: { A1: { b: 1 }, B1: { b: 1 } }, sel: "3:3" } },
        correct: "7C: the rows below move up", wrong: ["Nothing: row 3 is blank", "7B", "7D"] },
      { type: "choice", fact: "the blank row stays", prompt: "You select row 3 and press the Delete key. What happens?", correct: "The cells are emptied, but the blank row stays", wrong: ["Row 3 is gone and the rows below move up", "Everything to the right moves left", "Nothing at all"] },
      { type: "choice", fact: "everything to the right moves left", prompt: "You delete column B. What happens to column C?", correct: "It moves left and becomes column B", wrong: ["It stays column C, next to an empty B", "It moves right", "It's deleted too"] },
      { type: "choice", fact: "Everything below moves up", prompt: "C4 holds =B4*$B$12. You delete row 7. What does C4 say now?", correct: "=B4*$B$11: it follows the cell", wrong: ["=B4*$B$12: it's locked", "=B4*$B$13", "=B3*$B$11"] },
    ],
  },
  // ======================================================= Lesson 5
  MAX: {
    learn: { visual: { grid: { cols: 2, rows: 8, widths: { A: 1.2 }, cells: { ...pts, A8: "Highest", B8: 30 }, style: ptsStyle, sel: "B8", nameBox: true, formula: "=MAX(B2:B6)" } },
      note: "MAX looks at every value in B2:B6 and gives the highest: 30 (the Comets)." },
    exercises: [
      { type: "choice", fact: "gives the highest value in the range", prompt: "B8 holds =MAX(B2:B6). What does B8 show?",
        visual: { grid: { cols: 2, rows: 8, widths: { A: 1.2 }, cells: { ...pts, A8: "Highest", B8: "?" }, style: ptsStyle, sel: "B8" } },
        correct: "30", wrong: ["9", "94", "18.8"] },
      { type: "formula", fact: "the range in brackets", prompt: "Write a function that gives the highest value in B4:B9.", accept: ["=MAX(B4:B9)"] },
      { type: "choice", fact: "Same shape as SUM", prompt: "Which one finds the highest score in C2:C9?", correct: "=MAX(C2:C9)", wrong: ["=MAX(C2-C9)", "MAX(C2:C9)", "=MAX C2:C9"] },
      { type: "gridRange", fact: "the range in brackets", target: ["B2:B6"], prompt: "You've typed =MAX( into B8. Now drag over the points: B2 to B6.",
        grid: { cols: 2, rows: 8, widths: { A: 1.2 }, cells: { ...pts, A8: "Highest", B8: "=MAX(" } } },
      { type: "choice", fact: "gives the highest value in the range", prompt: "You want the stall that took the most money. Which function do you use?", correct: "MAX", wrong: ["MIN", "SUM", "AVERAGE"] },
    ],
  },
  MIN: {
    learn: { visual: { grid: { cols: 2, rows: 8, widths: { A: 1.2 }, cells: { ...pts, A8: "Lowest", B8: 9 }, style: ptsStyle, sel: "B8", nameBox: true, formula: "=MIN(B2:B6)" } },
      note: "MIN gives the lowest: 9 (the Planets). MAX and MIN have the same shape but opposite jobs." },
    exercises: [
      { type: "choice", fact: "gives the lowest value in the range", prompt: "B8 holds =MIN(B2:B6). What does B8 show?",
        visual: { grid: { cols: 2, rows: 8, widths: { A: 1.2 }, cells: { ...pts, A8: "Lowest", B8: "?" }, style: ptsStyle, sel: "B8" } },
        correct: "9", wrong: ["30", "12", "0"] },
      { type: "formula", fact: "gives the lowest value in the range", prompt: "Write a function that gives the lowest value in C2:C9.", accept: ["=MIN(C2:C9)"] },
      { type: "choice", fact: "gives the lowest value in the range", prompt: "A week of temperatures is in B2:B8. Which formula finds the coldest one?", correct: "=MIN(B2:B8)", wrong: ["=MAX(B2:B8)", "=SUM(B2:B8)", "=AVERAGE(B2:B8)"] },
      { type: "choice", fact: "gives the lowest value in the range", prompt: "C2:C6 hold 7, 3, 9, 3 and 5. What does =MIN(C2:C6) show?",
        visual: { grid: { cols: 3, rows: 6, cells: { C2: 7, C3: 3, C4: 9, C5: 3, C6: 5 } } }, correct: "3", wrong: ["6", "9", "27"] },
    ],
  },
  AVERAGE: {
    learn: { visual: { grid: { cols: 2, rows: 8, widths: { A: 1.2 }, cells: { A1: "Day", B1: "Laps", A2: "Mon", B2: 4, A3: "Tue", B3: 6, A4: "Wed", B4: 8, A5: "Thu", B5: 10, A6: "Fri", B6: 12, A8: "Average", B8: 8 }, style: ptsStyle, sel: "B8", nameBox: true, formula: "=AVERAGE(B2:B6)" } },
      note: "Add them up: 4 + 6 + 8 + 10 + 12 = 40. Divide by how many there are (5): 40 ÷ 5 = 8." },
    exercises: [
      { type: "choice", fact: "every value added up, then divided by how many there are", prompt: "B2:B6 hold 4, 9, 1, 6 and 10. What does =AVERAGE(B2:B6) show?",
        visual: { grid: { cols: 2, rows: 6, cells: { B1: "Points", B2: 4, B3: 9, B4: 1, B5: 6, B6: 10 }, style: { B1: { b: 1 } } } }, correct: "6", wrong: ["30", "10", "5"] },
      { type: "choice", fact: "gives the mean", prompt: "Say it: what's the average of 10 and 20?", correct: "15", wrong: ["30", "10", "2"] },
      { type: "formula", fact: "gives the mean", prompt: "Write a function that gives the average (the mean) of B2 to B6.", accept: ["=AVERAGE(B2:B6)", "=SUM(B2:B6)/5"] },
      { type: "choice", fact: "every value added up, then divided by how many there are", prompt: "How does AVERAGE work out 2, 4 and 6?", correct: "2 + 4 + 6 = 12, then 12 ÷ 3 = 4",
        wrong: ["2 + 4 + 6 = 12, then 12 ÷ 2 = 6", "2 × 4 × 6 = 48, then 48 ÷ 3 = 16", "It gives the highest: 6"] },
      { type: "choice", fact: "gives the mean", prompt: "Which formula gives the average of B2:B6?", correct: "=AVERAGE(B2:B6)", wrong: ["=SUM(B2:B6)", "=AVERAGE(B2-B6)", "=AVERAGE B2:B6"] },
    ],
  },
  "fill across": {
    learn: { visual: { grid: { cols: 4, rows: 5, widths: { A: 0.8, B: 1.3, C: 1.3, D: 1.3 }, cells: { B1: "Quiz 1", C1: "Quiz 2", D1: "Quiz 3", A2: "Ava", B2: 7, C2: 9, D2: 6, A3: "Leo", B3: 8, C3: 5, D3: 10, A5: "Best", B5: "=MAX(B2:B3)", C5: "=MAX(C2:C3)", D5: "=MAX(D2:D3)" }, style: { B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 }, A5: { b: 1 } }, sel: "B5:D5" } },
      note: "Filled right from B5, with the formulas showing: the letters move (B, C, D). The row numbers stay the same." },
    exercises: [
      { type: "fillFormula", fact: "=MAX(B2:B10) becomes =MAX(C2:C10)", formula: "=MAX(B2:B3)", from: "B5", to: "D5",
        grid: { cols: 4, rows: 5, widths: { A: 0.8, B: 1.3, C: 1.3, D: 1.3 }, cells: { B1: "Quiz 1", C1: "Quiz 2", D1: "Quiz 3", A2: "Ava", B2: 7, C2: 9, D2: 6, A3: "Leo", B3: 8, C3: 5, D3: 10, A5: "Best" }, style: { B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 }, A5: { b: 1 } } } },
      { type: "fillFormula", fact: "Drag the fill handle to the right", formula: "=AVERAGE(B2:B4)", from: "B6", to: "C6",
        grid: { cols: 3, rows: 6, widths: { A: 0.9, B: 1.6, C: 1.6 }, cells: { B1: "Term 1", C1: "Term 2", A2: "Ava", B2: 70, C2: 80, A3: "Leo", B3: 65, C3: 75, A4: "Mia", B4: 90, C4: 85, A6: "Average" }, style: { B1: { b: 1 }, C1: { b: 1 }, A6: { b: 1 } } } },
      { type: "fillFormula", fact: "Filling down moves the numbers instead", formula: "=B2/$B$6", from: "C2", to: "C4",
        grid: { cols: 3, rows: 6, widths: { A: 0.9, C: 1.5 }, cells: { A1: "Stall", B1: "Takings", C1: "Share", A2: "Cakes", B2: 60, A3: "Books", B3: 30, A4: "Plants", B4: 30, A6: "Total", B6: 120 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, A6: { b: 1 } } } },
      { type: "fillFormula", fact: "its column letters move", formula: "=B3*$A$1", from: "B4", to: "D4",
        grid: { cols: 4, rows: 4, widths: { B: 1.3, C: 1.3, D: 1.3 }, cells: { A1: "10%", A3: "Sales", B3: 200, C3: 150, D3: 80, A4: "Share" }, style: { A1: { align: "right" }, A3: { b: 1 }, A4: { b: 1 } } } },
      { type: "choice", fact: "its column letters move", prompt: "You fill a formula across, to the right. What changes in it?", correct: "The column letters", wrong: ["The row numbers", "Nothing: it copies exactly", "The function's name"] },
      { type: "formula", fact: "=MAX(B2:B10) becomes =MAX(C2:C10)", prompt: "B13 holds =MIN(B4:B9). You fill it right to D13. Type the formula that's now in D13.", accept: ["=MIN(D4:D9)"] },
    ],
  },
  "decimal places buttons": {
    learn: { visual: { image: "sheets-basic", highlight: "decDecrease" },
      note: "Fewer decimals (.0 ←) and more decimals (.00 →). Click fewer decimals until 26.666667 shows 27. Click the cell: it still holds 26.666…" },
    exercises: [
      { type: "hotspot", fact: "Two toolbar buttons", screen: "sheets-basic", target: "decDecrease", prompt: "Tap the button that shows fewer decimal places." },
      { type: "hotspot", fact: "Two toolbar buttons", screen: "sheets-basic", target: "decIncrease", prompt: "Tap the button that shows more decimal places." },
      { type: "choice", fact: "Only the look changes", prompt: "A cell shows 26.666667. You click fewer decimals until it's a whole number. What does it show, and what does it hold?",
        correct: "Shows 27, still holds 26.666…", wrong: ["Shows 27, now holds 27", "Shows 26, now holds 26", "Shows 26, still holds 26.666…"] },
      { type: "choice", fact: "the cell still holds every decimal", prompt: "C2 holds =AVERAGE(B2:B4), which is 26.666… You clicked fewer decimals, so C2 shows 27. D2 holds =C2*3. What does D2 show?",
        visual: { grid: { cols: 4, rows: 4, widths: { C: 1.2 }, cells: { B1: "Score", C1: "Average", D1: "× 3", B2: 20, B3: 30, B4: 30, C2: 27, D2: "?" }, style: { B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 } }, sel: "D2" } },
        correct: "80: it uses 26.666…, not 27", wrong: ["81: it uses 27", "27", "78"] },
      { type: "choice", fact: "change how many decimal places a number shows", prompt: "B5 shows 3.5. You click more decimals once. What does it show now?", correct: "3.50", wrong: ["3.5", "35", "4"] },
      { type: "choice", fact: "Only the look changes", prompt: "Why click fewer decimals on an average like 26.666667?", correct: "It's easier to read. The value doesn't change.", wrong: ["It makes the answer more exact", "It changes the value to 27", "It deletes the formula"] },
    ],
  },
  "percentage format": {
    learn: { visual: { image: "sheets-basic", highlight: "percent" },
      note: "A formula gives 0.25. Click % and it shows 25%. In Lesson 4 you typed 10% into a cell. Here the formula makes the number, and % only changes the look." },
    exercises: [
      { type: "choice", fact: "0.25 shows as 25%", prompt: "A cell holds 0.4. You click %. What shows?", correct: "40%", wrong: ["0.4%", "4%", "400%"] },
      { type: "choice", fact: "The cell still holds 0.25", prompt: "A cell shows 25% because you clicked %. What number does it hold?", correct: "0.25", wrong: ["25", "2.5", "250"] },
      { type: "hotspot", fact: "shows a number as a percentage", screen: "sheets-basic", target: "percent", prompt: "Tap the button that shows a number as a percentage." },
      { type: "choice", fact: "Format → Number → Percent", prompt: "Which menu also shows a number as a percentage?", correct: "Format → Number → Percent", wrong: ["Insert → Percent", "Data → Number → Percent", "View → Percent"] },
      { type: "choice", fact: "shows a number as a percentage", prompt: "I4:I9 hold each stall's share of the takings. I10 holds =SUM(I4:I9) and shows 1. What should you do?",
        correct: "Click %: 1 shows as 100%", wrong: ["Change the formula: it should give 100", "Type 100% over it", "Delete row 10"] },
      { type: "choice", fact: "0.25 shows as 25%", prompt: "I4 shows 0.2865. You click %. What shows?", correct: "28.65%", wrong: ["0.2865%", "2865%", "0.29%"] },
    ],
  },
  "order of operations": {
    learn: { visual: { steps: ["Brackets ( )", "× and ÷ (* and /)", "+ and −"] },
      note: "=2+3*4: 3*4 first (12), then + 2. That's 14. =(2+3)*4: the brackets first (5), then × 4. That's 20." },
    exercises: [
      { type: "choice", fact: "=2+3*4 is 14", prompt: "What does =4+6*2 give?", correct: "16", wrong: ["20", "12", "48"] },
      { type: "choice", fact: "then × and ÷", prompt: "What does =10-6/2 give?", correct: "7", wrong: ["2", "13", "4"] },
      { type: "choice", fact: "brackets go first", prompt: "Which formula gives 20?", correct: "=(2+3)*4", wrong: ["=2+3*4", "=2*3+4", "=2+(3*4)"] },
      { type: "choice", fact: "brackets go first", prompt: "B2 holds 6 and C2 holds 4. Which formula gives their average, 5?", correct: "=(B2+C2)/2", wrong: ["=B2+C2/2", "=B2/2+C2", "=(B2+C2)*2"] },
      { type: "choice", fact: "then × and ÷", prompt: "B2 holds 6 and C2 holds 4. What does =B2+C2/2 give?", correct: "8: only C2 is halved", wrong: ["5: the average", "10", "3"] },
      { type: "formula", fact: "brackets go first", prompt: "B2 and C2 hold two scores. In D2, add them up, then halve the total. Use + and /.", accept: ["=(B2+C2)/2", "=(C2+B2)/2"],
        visual: { grid: { cols: 4, rows: 2, cells: { B1: "Test 1", C1: "Test 2", D1: "Average", B2: 6, C2: 4 }, style: { B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 } }, sel: "D2" } } },
      { type: "choice", fact: "then × and ÷", prompt: "B2 holds 6 and C2 holds 4. What does =B2*5+C2*3 give?", correct: "42", wrong: ["102", "18", "60"] },
    ],
  },
  "a fixed number in a formula": {
    learn: { visual: { grid: { cols: 4, rows: 2, widths: { B: 1.3, C: 1, D: 1.1 }, cells: { A1: "Team", B1: "Bullseyes", C1: "Hits", D1: "Points", A2: "Rockets", B2: 12, C2: 30, D2: 150 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 }, D1: { b: 1 } }, sel: "D2", nameBox: true, formula: "=B2*5+C2*3" } },
      note: "5 and 3 are the game's rules: they never change, so they can go straight in the formula. A price might change, so it goes in a cell." },
    exercises: [
      { type: "choice", fact: "a game's points rule", prompt: "A hit is worth 3 points. That's the game's rule. Do you type 3 into the formula, or use a cell?", correct: "Type 3: it never changes", wrong: ["Use a cell, locked with $", "Use a cell, without $", "Leave the 3 out"] },
      { type: "choice", fact: "Anything that might change goes in a cell", prompt: "Which one should go in a cell, not straight into the formula?", correct: "The ticket price", wrong: ["12, the months in a year", "7, the days in a week", "2, to halve a number"] },
      { type: "choice", fact: "12 months in a year", prompt: "Which number is fine to type straight into a formula?", correct: "12, the months in a year", wrong: ["The ticket price", "The charity rate", "The class budget"] },
      { type: "formula", fact: "12 months in a year", prompt: "B2 holds the cost for a whole year. In C2, work out the cost for one month.", accept: ["=B2/12"],
        visual: { grid: { cols: 3, rows: 2, widths: { B: 1.2, C: 1.2 }, cells: { A1: "Item", B1: "Per year", C1: "Per month", A2: "Phone", B2: 360 }, style: { A1: { b: 1 }, B1: { b: 1 }, C1: { b: 1 } }, sel: "C2" } } },
      { type: "formula", fact: "a game's points rule", prompt: "A bullseye scores 5 and a hit scores 3. Bullseyes are in B4 and hits are in C4. In D4, work out the points.", accept: ringToss,
        visual: { grid: { cols: 4, rows: 4, widths: { B: 1.3, D: 1.1 }, cells: { A3: "Team", B3: "Bullseyes", C3: "Hits", D3: "Points", A4: "Rockets", B4: 12, C4: 30 }, style: { A3: { b: 1 }, B3: { b: 1 }, C3: { b: 1 }, D3: { b: 1 } }, sel: "D4" } } },
      { type: "lockRef", fact: "locked with $ if every row uses it", prompt: "E4 is each team's share: its points (D4) ÷ all the teams' points (D9). Lock the reference every row shares.", formula: "=D4/D9", lock: ["D9"] },
      { type: "choice", fact: "Anything that might change goes in a cell", prompt: "The ticket price ($2) is in B1, and it might change. Tickets sold are in B4. You'll fill C4 down the list. What goes in C4?",
        correct: "=B4*$B$1", wrong: ["=B4*2", "=B4*B1", "=$B$4*B1"] },
    ],
  },
};
