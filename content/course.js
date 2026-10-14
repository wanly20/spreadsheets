// The learning path: which lessons exist and how each is split into levels.
//
// Levels list knowledge items by their exact `term` from knowledge_lessonN.js,
// in the order they are taught (the slide order). Any item that is not listed
// is added to the nearest level automatically, so editing the spreadsheet can
// never break the app, but tools/check_content.mjs warns about it.
//
// To add a lesson: copy its knowledge file in (tools/sync_content.sh does it
// once the lesson is listed here without comingSoon), add its levels, and
// optionally write extra exercises in content/practice.js.
export const course = {
  lessons: [
    {
      n: 1,
      title: "Lesson 1",
      subtitle: "Cells, ranges, the fill handle, formatting and sheets",
      theme: "green",
      levels: [
        { id: "1-1", title: "The grid", icon: "grid", terms: ["spreadsheet", "cell", "column", "row", "cell reference"] },
        { id: "1-2", title: "Ranges and the fill handle", icon: "move-down", terms: ["range", "Name Box", "fill handle", "fill to copy", "fill a pattern"] },
        { id: "1-3", title: "Move, clear and undo", icon: "undo", terms: ["move cells", "clear cell contents", "undo", "redo"] },
        { id: "1-4", title: "Formatting", icon: "paint-bucket", terms: ["select, then apply", "text formatting", "fill colour", "borders"] },
        { id: "1-5", title: "Sheets", icon: "layers", terms: ["sheet", "insert a sheet", "rename a sheet", "duplicate a sheet", "move a sheet", "colour a sheet tab"] },
      ],
      review: { id: "1-r", title: "Mixed review" },
    },
    {
      n: 2,
      title: "Lesson 2",
      subtitle: "Formatting: width, wrap, merge, dates and money",
      theme: "blue",
      levels: [
        { id: "2-1", title: "Fit the cells", icon: "text-wrap", terms: ["column width", "row height", "vertical alignment", "text wrap"] },
        { id: "2-2", title: "Merge, align and locale", icon: "grid", terms: ["merge cells", "horizontal alignment", "locale", "format vs value"] },
        { id: "2-3", title: "Dates, money and growing sheets", icon: "calendar", terms: ["date format", "currency format", "insert row/column", "freeze panes", "conditional formatting"] },
      ],
      review: { id: "2-r", title: "Mixed review" },
    },
    {
      n: 3,
      title: "Lesson 3",
      subtitle: "Formulas, cell references and SUM",
      theme: "yellow",
      levels: [
        { id: "3-1", title: "Formulas", icon: "zap", terms: ["formula", "operators", "why use a cell reference"] },
        { id: "3-2", title: "Click, fill and check", icon: "pointer", terms: ["click to add a reference", "fill a formula", "show formulas"] },
        { id: "3-3", title: "SUM, subtracting and paint format", icon: "plus", terms: ["function", "SUM", "order when subtracting", "paint format"] },
      ],
      review: { id: "3-r", title: "Mixed review" },
    },
    {
      n: 4,
      title: "Lesson 4",
      subtitle: "Relative and absolute references, percentages, deleting rows",
      theme: "green",
      levels: [
        { id: "4-1", title: "References that move, and $", icon: "lock", terms: ["relative reference", "percentage in a cell", "absolute reference"] },
        { id: "4-2", title: "When to lock, and deleting rows", icon: "layers", terms: ["when to lock a reference", "delete a row or column"] },
      ],
      review: { id: "4-r", title: "Mixed review" },
    },
    {
      n: 5,
      title: "Lesson 5",
      subtitle: "MAX, MIN and AVERAGE, decimals and %, order of operations",
      theme: "blue",
      levels: [
        { id: "5-1", title: "MAX, MIN and AVERAGE", icon: "zap", terms: ["MAX", "MIN", "AVERAGE"] },
        { id: "5-2", title: "Fill across, decimals and %", icon: "arrow-right", terms: ["fill across", "decimal places buttons", "percentage format"] },
        { id: "5-3", title: "Which part goes first?", icon: "list-ordered", terms: ["order of operations", "a fixed number in a formula"] },
      ],
      review: { id: "5-r", title: "Mixed review" },
    },
  ],
  // The big review at the end of the path, across every lesson that is ready.
  finalReview: { id: "all-r", title: "Lessons 1–5 review", needs: [1, 2, 3, 4, 5] },
};
