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
//   gridMove   drag a cell to a new place
//   keys       press the real shortcut (multiple choice on touch screens)
//   hotspot    tap something on a real screenshot (`screen`) or a drawn part of Sheets (`ui`)
//   order      put the steps in order
// Grid targets can be a list: one is picked at random each time.

const shop = { A1: "Item", B1: "Price", C1: "Qty", D1: "Total", A2: "Pen", B2: 2, C2: 3, D2: 6, A3: "Ruler", B3: 3, C3: 2, D3: 6 };

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
      { type: "choice", fact: "The whole file is the spreadsheet", prompt: "Fill the gaps: the whole file is the ____. Each tab is a ____.",
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
};
