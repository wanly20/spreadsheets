// Sorting a small table the way Google Sheets does it (Data → Sort range), and
// the likely mistakes, for "Predict the sort". Pure functions: tools/check_content.mjs
// imports this file in Node to check every sort question has exactly one right answer.
//
// A sort question: { head: ["Helper", "Hours"], rows: [["Sam", 4], …], by: "Hours", dir: "za",
//                    then?: { by: "Last name", dir: "az" } }
// A → Z (az): earliest letter or smallest number first. Z → A (za): the opposite.

/** Compare two cell values, A → Z: numbers before text, text ignoring capitals. */
export function compareCells(a, b) {
  const na = typeof a === "number", nb = typeof b === "number";
  if (na && nb) return a - b;
  if (na !== nb) return na ? -1 : 1;
  return String(a).localeCompare(String(b), "en", { sensitivity: "base" });
}

/** The rows sorted by a list of [column index, "az" | "za"] keys (stable, like Sheets). */
export function sortRows(rows, keys) {
  return rows
    .map((r, i) => [r, i])
    .sort(([a, i], [b, j]) => {
      for (const [c, dir] of keys) {
        const d = compareCells(a[c], b[c]);
        if (d) return dir === "za" ? -d : d;
      }
      return i - j;
    })
    .map(([r]) => r);
}

const flip = (dir) => (dir === "az" ? "za" : "az");
export const dirLabel = (dir) => (dir === "az" ? "A → Z" : "Z → A");

/** The sort keys of a question, as [column index, dir]. */
export function sortKeys(q) {
  const keys = [[q.head.indexOf(q.by), q.dir]];
  if (q.then) keys.push([q.head.indexOf(q.then.by), q.then.dir]);
  return keys;
}

/** One table as text, so options can be compared: "Priya 7 / Lily 5 / …". */
export const rowsText = (rows) => rows.map((r) => r.join(" ")).join(" / ");

/** Rows that can't be told apart by the sort keys (then the answer isn't certain). */
export function sortTies(q) {
  const keys = sortKeys(q);
  const seen = new Set(), ties = [];
  for (const r of q.rows) {
    const k = keys.map(([c]) => String(r[c]).toLowerCase()).join("|");
    if (seen.has(k)) ties.push(k.replace("|", ", "));
    seen.add(k);
  }
  return ties;
}

/** The right table and three likely mistakes (each a list of rows). */
export function sortOptions(q) {
  const keys = sortKeys(q);
  const [[c1, d1], second] = keys;
  const correct = sortRows(q.rows, keys);
  const wrong = [];
  const add = (rows) => {
    if (rows && rowsText(rows) !== rowsText(correct) && !wrong.some((w) => rowsText(w) === rowsText(rows))) wrong.push(rows);
  };
  if (second) {
    add(sortRows(q.rows, [[c1, d1]])); // the second column forgotten: ties stay as typed
    add(sortRows(q.rows, [[c1, d1], [second[0], flip(second[1])]])); // the second column the wrong way
    add(sortRows(q.rows, [[c1, flip(d1)], second])); // the first column the wrong way
  }
  add(sortRows(q.rows, keys.map(([c, d], i) => [c, i ? d : flip(d)]))); // A → Z and Z → A mixed up
  // Only the sort column was selected: it moves, the other columns stay where they were.
  const col = sortRows(q.rows, [[c1, d1]]).map((r) => r[c1]);
  add(q.rows.map((r, i) => r.map((v, c) => (c === c1 ? col[i] : v))));
  const other = q.head.findIndex((_, c) => c !== c1 && (!second || c !== second[0]));
  if (other >= 0) add(sortRows(q.rows, [[other, d1]])); // sorted by the wrong column
  add(q.rows); // not sorted at all
  return { correct, wrong: wrong.slice(0, 3) };
}
