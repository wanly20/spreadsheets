# Spreadsheets practice: UI/UX review (1 Nov 2026)

A design review of the Year 7 spreadsheets practice app for its real users: 12–13-year-olds on school Chromebooks (1366×768, sometimes 1920×1080 on an external screen) and on phones (390×844). Judged on cognitive load and attention first, looks second. It is a review only: nothing in `js/`, `css/` or `content/` was changed.

**How it was checked.** Served on port 8767 and driven with headless Chromium (software rendering, fresh browser contexts, so no saved progress was touched). I ran the app’s own end-to-end player over the whole path at 1366×768 (every level and review, right and wrong answers), played the first three levels and a Review at 390×844 and 1920×1080, the `#/play/sampler` (one of every exercise type, all answered wrong once) at 390×844, and walked `#/play/gallery-1` to `gallery-7` on the phone (every learn card and hand-made exercise). An in-page check measured every tap target, the contrast of every visible text node, sideways overflow and the distance from the content to Check. Mockups (files starting `mock-`) were made by injecting CSS (and, for the feedback card, moving one element) in my browser only.

Screenshot paths are relative to `docs/`. Effort: **S** is a CSS tweak or under an hour, **M** a few hours or a small JS change, **L** a day or more. Juan answers on the review page: `~/Documents/teaching_app/review/spreadsheets-ui-review.html`.

**What already works well (keep it):**

- Colour contrast passes WCAG AA across the app (`tools/contrast.py` and my in-browser check found only the faded Match cards and the decorative “+” between keycaps).
- No sideways scrolling at 390 px on any screen I checked (every exercise type, path, My knowledge, settings).
- Thumb reach on the phone: one full-width Check / Continue at the bottom, and the top-bar buttons are 44 px or more.
- Feedback that names the mistake on hotspots, keys and Match (“You tapped the Format menu”, “You pressed Ctrl + X”, “You matched cell with…”), and kind, specific tips for formulas (“Start with =”, “Lock it!”, “Letter first!”).
- Predict the sort and Predict the fill play the answer out on the grid after you check: a worked example right when it’s most useful.
- Charts with a pattern and a colour for every series; the Atkinson Hyperlegible font for everything you read; the path with every level open and one START.
- Right-answer feedback is short. Keep it that way.

## Dev-course findings: which carry over

The dev course’s engine was modelled on this app, so each finding from `~/Documents/dev_course/docs/ui-review.md` (Juan’s answers: `~/Documents/dev_course/docs/ui-review-answers.md`) was checked here.

| Dev-course finding | Here |
|---|---|
| #1 Notes away from the code (split attention) | Doesn’t apply: the learn-card tip sits right under its picture. The nearest thing is L2 (tall cards under the bar at 1366). |
| #2 Check / Continue far from the content | Applies, measured: #4. |
| #3 Code cut off on the phone | Applies in another form: real screenshots shrunk too small (#1) and cut-off cell text (#6). No page scrolls sideways. |
| #4 Terminal size · #5 command prompt far away · #6 HEAD on the map · #7 raw go test output | Don’t apply (no terminal, no git, no tests). The disabled grey button of #5 has a twin here: E4. |
| #8 Phone titles cut off | Doesn’t apply: level labels wrap on the phone path. |
| #9 Wrong answer hides what you picked | Applies on the phone for choice, predict, chart choice, lock and typed answers: #3. Hotspots, keys and Match already say what you did. |
| #10 Faint meaningful text | Mostly doesn’t apply: the tokens pass AA. Only the faded Match cards (E6). The real readability problem is the screenshots (#1). |
| M4 Pulsing forever | Applies, in more places: #7. |
| M7 Zero streak / XP chips | You kept them in the dev course, so not raised again. P1 is only about the seven empty lesson bars. |
| L2 Say it once | Applies to the wrong-answer sheet (#2) and a few learn-card tips (L3). |
| L3 Mascot squeezes text on the phone | Applies to the feedback sheet, not the learn card: #3. |
| E1 Match breaks words on the phone | Doesn’t apply: the cards wrap cleanly. |
| E2 Number badges on touch screens | Already hidden on touch screens. The problem here is the opposite: on the laptop they clash with numbered steps and gaps (#5). |
| F1 Feedback sheet not lined up with the content | The text does line up (by luck, at 1366 and 1920); Continue does not: part of #4. |
| C1 Continue far away · C2 Confetti on every level | Both apply: C1 and #9. |
| R1 Review looks like a level | Applies, plus the wrong end text: #8. |
| K2 My knowledge repetition | Applies: K1. |
| S3 / G1 Small controls | The app chrome is fine (44 px or more). The small targets are inside exercises: #1 and #6, plus the sound switch (S1). |
| G3 Thumb reach is good | Same here: keep it. |

---

## Top 10, ranked by impact on students’ learning

### 1. Phone: make the real Google Sheets screenshots big enough to read and tap
- **Problem.** On a 390 px phone the screenshots shrink to about a third of their size. The menu text is about 6 px high. In “Sort range” each menu item is a 181×18 px target, the fill handle is 16×16 px, the chart editor’s Setup and Customise tabs are 52×21 px and the Sort window’s close button is 25×23 px. On the Name Box learn card the Name Box is 40 px wide and you can’t read the “C2” in it, while half the screen below the card is empty. Screenshots: `ui-review/phone-learn-name-box.png` (Now: the Name Box learn card); `ui-review/phone-learn-sort-range.png` (Now: the “sort range” learn card); `ui-review/phone-learn-chart-editor.png` (Now: the “chart editor” learn card); `ui-review/phone-ex-hotspot-menu.png` (Now: “Sort range” is 18 px tall); `ui-review/phone-ex-hotspot-editor.png` (Now: the chart editor); mockup `ui-review/mock-phone-hot-data-menu-after.png` (Mockup: the Data menu, zoomed); mockup `ui-review/mock-phone-hot-setup-column-after.png` (Mockup: the editor sidebar, zoomed); mockup `ui-review/mock-phone-hot-basic-after.png` (Mockup: the toolbar corner, zoomed).
- **Why it matters for a 12-year-old.** These exercises are there so the real menus look familiar in class. If a 12-year-old can’t read the menu, they guess from the position, and a thumb that lands on the item next door counts as a wrong answer that comes back in Review as a “mistake” they never made.
- **Fix.** On phones, show a crop of the screenshot around the part that matters (the open menu, the editor’s sidebar, the toolbar corner) at 2–2.5×. Keep the nearby wrong choices in the crop, add a small “⤢ whole screen” button for context, and give every target at least 44 px. Use the same crop on the learn card.
  Store one phone crop per screen in `content/screens.js` (`phoneCrop: [x, y, w, h]` in image pixels); `tools/crop_screens.py` already prints the regions, so the crop can be the union of the regions near the target. Render it as the same `<img>` inside a wrapper with `overflow: hidden` and a `transform: scale()`, so the existing region coordinates keep working. On `(pointer: coarse)`, drop `.hot--tight` and give `.hot::before` `min-width/min-height: 44px`. The mockups were made exactly this way (CSS transform on my copy only).
  **Choice for Juan:** A. A zoomed crop per screen, with a “whole screen” button (recommended); B. Keep the whole screenshot but let them pinch or tap to zoom; C. Leave as it is.
- **Effort:** M. Dev course: #3 (cut-off code on the phone), in a different form.

### 2. After a wrong answer, say it once: what you did, why, the answer
- **Problem.** The wrong-answer sheet stacks up to five parts: the title, a tip, “We’ll come back to this one”, “Correct answer:” and then the whole definition in small grey text. The same fact often appears two or three times. “Name the range”: the tip says “Write the first cell first: A3:D3”, then Correct answer A3:D3, then the definition. “Lock it!” runs to seven lines and says “$ is Shift + 4” twice. Chart choice prints its tip twice: that one is a bug (in `exercises.js`, `chartChoice` returns `step.why` as the body, and `lesson.js` adds `step.why` again). Screenshots: `ui-review/w1366-fb-wrong-formula-lock.png` (Now: “Lock it!”, seven lines); `ui-review/w1366-fb-wrong-chartchoice.png` (Now: chart choice prints the tip twice); `ui-review/w1366-fb-wrong-rangename.png` (Now: A3:D3 three times); mockup `ui-review/mock-w1366-choice-wrong-slim.png` (Mockup: you chose · why · answer, definition behind a link).
- **Why it matters for a 12-year-old.** Right after a mistake, working memory is busy with the surprise. One clear contrast (“you did X; it’s Y, because Z”) is what sticks. Saying the same thing three times is the redundancy effect, and the small grey definition at the bottom is the part a 12-year-old skips anyway.
- **Fix.** A fixed order of at most three lines: You chose / typed X (struck through) → one reason (the tip) → Answer: Y (left out when the tip already says it). The definition moves behind a “What does it mean?” link, or shows only on questions about meaning. “We’ll come back to this one” becomes a small tag beside the title. Fix the chart-choice double tip now.
  In `lesson.js` `showFeedback`: build `[you, tip, answer]`; skip `answer` when `step.why`/`result.body` already contains `result.answer`; render the definition as a `<details>` (or show it only for `gen` in `termToDef`, `defToTerm`, `gaps`). In `exercises.js` `chartChoice`, return `body: ""` (the `step.why` line in `lesson.js` already prints it).
  **Choice for Juan:** A. Definition behind a “What does it mean?” link; B. Show the definition only on questions about meaning; C. Leave as it is (but fix the double tip).
- **Effort:** S–M. Dev course: #9 (show what you picked), plus the redundancy point from L2.

### 3. Phone: keep what you chose in view after a wrong answer
- **Problem.** On the phone the wrong-answer sheet covers the options. In a multiple-choice question, “Predict the fill”, chart choice and “lock the reference”, the option you picked is out of sight while the sheet explains why it’s wrong. In “Name the range” it even hides your typed answer (the “B6:B2” is cut off). The mascot keeps 96–112 px free on the right, so the text runs in a column about 250 px wide and the sheet grows to about 60 % of the screen. Screenshots: `ui-review/phone-fb-wrong-choice.png` (Now: your choice is under the sheet); `ui-review/phone-fb-wrong-rangename.png` (Now: your typed answer is cut off); `ui-review/phone-fb-wrong-chartchoice.png` (Now: chart choice); mockup `ui-review/mock-phone-choice-wrong-after.png` (Mockup: you chose, the right answer, both in view).
- **Why it matters for a 12-year-old.** Feedback works best when the mistake and the correction are seen together. Duolingo always shows your answer next to the right one. Hotspots, keys and Match already say “You tapped…”, “You pressed…”, “You matched…”, so only the other types are missing it.
- **Fix.** Add a first line “You chose: ~~23~~” (or “You typed: ~~B6:B2~~”). Make the mascot 64 px in the corner, so the text uses the full width, cap the sheet at about 55 % of the height, and scroll the chosen option into view just above it.
- **Effort:** S. Dev course: #9, same problem.

### 4. Laptop: bring Check and Continue close to the content
- **Problem.** The bottom bar is lined up to a 1000 px column, but the content is 720 px wide. So Check and Continue always stick out 140 px past the right edge of the content, and the content is centred in the window above them. On the 1366×768 Chromebook, Check is 92–208 px below the last option or grid; on a 1920×1080 screen it is 226–341 px below (measured on every exercise type). Screenshots: `ui-review/w1366-ex-gridclick.png` (Now, 1366: Check 208 px below, 140 px to the right); `ui-review/w1920-ex-gridclick.png` (Now, 1920: 341 px below); `ui-review/w1920-fb-wrong-choice.png` (Now, 1920: Continue in the corner); mockup `ui-review/mock-w1366-choice-align.png` (B, 1366: bar lined up with the content); mockup `ui-review/mock-w1920-choice-near.png` (A, 1920: Check right under the options); mockup `ui-review/mock-w1920-choice-wrong-near-slim.png` (A, 1920: feedback right under the options); mockup `ui-review/mock-w1366-choice-wrong-near-slim.png` (A, 1366: the downside, the options scroll up).
- **Why it matters for a 12-year-old.** Every question ends with this button. Eye and mouse cross empty space on every step, and on the big screen the button is in a corner far from where the student was looking. Keyboard users press Enter (that works well), but most kids use the touchpad.
- **Fix.** Pick one. A: under the content on every laptop (what you chose for the dev course). B: keep the bottom bar but line it up with the content column, so the button’s right edge is the content’s right edge. C: B on short screens like the 1366×768 Chromebook, and A on tall screens (900 px high or more). On 768 px screens, A makes the content scroll when the feedback opens (see the last mockup), which is why C exists.
  Option B is one token: `--bar-max: 760px` (it is 1000px in `layout.css`), with `--foot-btn-w: 200px`. Option A: `.lesson-body { flex: 0 1 auto; margin-top: auto }`, `.ex { min-height: 0; justify-content: flex-start }`, `.lesson-foot { margin-bottom: auto; border-top: 0; background: none }`, and the feedback sheet rendered in that same spot as a card (in flow, not fixed to the window bottom). Option C: wrap A in `@media (min-width: 1024px) and (min-height: 900px)`.
  **Choice for Juan:** A. Under the content on every laptop; B. Keep the bottom bar, lined up with the content; C. B on short screens (1366×768), A on tall ones (recommended); D. Leave as it is.
- **Effort:** S–M. Dev course: #2 and F1, same problem.

### 5. Chromebook: the 1, 2, 3 key badges look like the answer order
- **Problem.** With a mouse, every card gets a number-key badge. In “Put the steps in order” the bank reads “1 Type E2 · 2 Press Enter · 3 Click in the Name Box”, right under slots numbered 1, 2, 3, so the badges look like the order. In “Fill the gaps”, gap ① sits next to the chip “1 Select”. (Phones already hide the badges.) Screenshots: `ui-review/w1366-ex-order.png` (Now: bank 1, 2, 3 under slots 1, 2, 3); `ui-review/w1366-ex-gaps.png` (Now: gap ① and chip “1 Select”); mockup `ui-review/mock-w1366-order-letters.png` (Mockup: letters on the bank).
- **Why it matters for a 12-year-old.** The badge is the biggest number on the card, and it is wrong for the task. A 12-year-old reads “1 Type E2” as “step 1”. That is a misleading cue at the moment of recall, which is exactly when the order should come from memory.
- **Fix.** Use letters on the bank cards and word chips (A, B, C…, pressed as keys), so numbers only ever mean “step” or “gap”. Or show the badges only after the student presses a number key once.
  **Choice for Juan:** A. Letters on bank cards and word chips; B. No badges until a number key is pressed; C. Leave as it is.
- **Effort:** S. Dev course: E2 (badges), the reverse case: here it’s the laptop.

### 6. Phone: bigger cells and headers in the mini spreadsheet, and no cut-off text
- **Problem.** On the phone the row numbers are 36×30 px, the column letters 64×24 px and the cells 56–64×30 px. “Click the number of row 4”, dragging a range or Ctrl-selecting two ranges all happen on targets well under 44 px. Narrow columns also cut text: “Mornin”, “Afternoo”, and in “Predict the fill” the answer “=MAX(D2:D3)” runs off the edge of the grid. Screenshots: `ui-review/phone-ex-gridclick.png` (Now: row numbers 36×30 px); `ui-review/phone-ex-gridmulti.png` (Now: “Mornin”, “Afternoo”); `ui-review/phone-fb-wrong-fillformula.png` (Now: the formula runs off the grid).
- **Why it matters for a 12-year-old.** The skill being practised is “click the row number” or “drag from A1 to C3”, not fine motor control. Mis-taps become wrong answers, and cut-off headings or formulas hide the very thing the question is about.
- **Fix.** On touch screens: rows 40 px, headers 32 px tall, an invisible larger hit area on row and column headers, columns sized to their text (or a shorter label), and long formulas shown in the formula bar above the grid rather than squeezed into the cell.
  `grid.js`: under `(pointer: coarse)` set the row height to 40px and header height to 32px; give `.sh-row, .sh-col` a `::before` that extends the hit area to 44px. Size columns from the longest value (Arial 13px) instead of equal widths; when a formula is longer than its cell, show it in the `fx` bar (as Sheets does) and let the cell show the start with an ellipsis.
- **Effort:** M. Dev course: #3 and G1 (phone overflow, tap targets).

### 7. Stop the motion that never ends
- **Problem.** Several things move forever: the mascot floats on every learn card, right next to the new term (3.2 s loop); the yellow ring pulses around the highlighted part of a screenshot; the active gap in “Fill the gaps” pulses; the keyboard icon floats in “Press the keys”; and on the path the START bubble bobs and the current level’s ring pulses. Screenshots: `ui-review/w1366-learn-spreadsheet.png` (The floating mascot on every learn card); `ui-review/w1366-ex-gaps.png` (The pulsing gap).
- **Why it matters for a 12-year-old.** Movement in the corner of the eye pulls attention, every time it moves. The learn card is the explicit-instruction moment, where all of the student’s attention should be on the term and the picture. A pulse that runs two or three times says “look here”; one that never stops is just noise.
- **Fix.** Let each one run two or three times and then stop. Keep the mascot still on learn cards (it can pop once when the card arrives). `prefers-reduced-motion` already turns it all off; this is for everyone else.
  `app.css`: `.learn-card__mascot { animation: none }` (or `float 3.2s 2`); `.node-wrap.is-current::before`, `.start-bubble`: `animation-iteration-count: 3`. `practice.css`: `.shot-ring`, `.is-ring`, `.gap.is-active`, `.key-zone__icon`: `animation-iteration-count: 3`.
- **Effort:** S. Dev course: M4 (the current dot pulsing forever), and more of it here.

### 8. Make Review look and end like Review
- **Problem.** A Review session looks exactly like a level: the same progress bar, no heading, no count and nothing to say why a term is back. At the end it says “Review done! Review. Play it again to earn more stars.”, gives stars, and throws confetti, but there is nothing to play again: Review is not a level on the path. Screenshots: `ui-review/w1920-review-first.png` (Now: a Review question, 1920); `ui-review/phone-review-first.png` (Now: phone); `ui-review/w1920-review-complete.png` (Now: “Play it again to earn more stars”).
- **Why it matters for a 12-year-old.** Spaced repetition only works if students do it, and they trust it more when it says why a card is back (Anki does this well). The wrong end text also makes Review feel like an extra level, not the way to make terms stronger.
- **Fix.** A kicker at the top, “Review · 10 terms you found tricky or haven’t seen for a while”, and a small tag on each question, “Missed last time” or “From Lesson 1, 5 days ago”. The code already has an “again” tag style (`ex-kicker__tag--again`). At the end: “Review done! 7 of 10 right first time. 4 terms are stronger now.”, with no stars and no “play again”.
- **Effort:** S–M. Dev course: R1, same problem.

### 9. Confetti only for something special
- **Problem.** Every finished level and every Review gets three bursts of confetti, even with 1 star and 25 % right first time. Screenshots: `ui-review/w1366-complete-1star.png` (Now: confetti at 1 star, 25 %); `ui-review/w1920-review-complete.png` (Now: confetti after Review at 5 %).
- **Why it matters for a 12-year-old.** Praise that is always there stops meaning anything. At 1 star the confetti and the “Play it again to earn more stars” line say two different things.
- **Fix.** Confetti for three stars or the last level of a lesson. Otherwise a quieter pop of the stars you earned.
  **Choice for Juan:** A. Only for three stars or a lesson’s last level (what you chose for the dev course); B. Always, but a smaller burst below three stars; C. Leave as it is.
- **Effort:** S. Dev course: C2, same problem.

### 10. Skip: quieter on the laptop, and the same on the phone
- **Problem.** On the laptop, a full-size white SKIP button sits bottom-left on every question, as big as Check. On the phone there is no Skip at all. Skipping shows “Here’s the answer” and the question comes back later, which is good. Screenshots: `ui-review/w1366-ex-choice.png` (Now: SKIP as big as CHECK); `ui-review/phone-ex-choice.png` (Now: no Skip on the phone).
- **Why it matters for a 12-year-old.** Trying to recall, even and especially when you get it wrong, is what makes the practice work. A big Skip button on every screen invites a 12-year-old to skip before trying. Having it on one device and not the other is also confusing.
- **Fix.** One quiet text button, “I don’t know yet”, in the same place on both (under the answers on the phone, bottom-left on the laptop). It shows the answer as Skip does now.
  **Choice for Juan:** A. A quiet “I don’t know yet” text button on both; B. Keep the big Skip on the laptop and add it to the phone; C. Leave as it is.
- **Effort:** S.

---

## Everything else, by screen

### Path

- **P1. Day one: seven empty progress bars in the side panel** (S) On a fresh start, the right panel lists Lesson 1 to Lesson 7, each with 0 / 18 stars and an empty grey bar, under “0 day streak” and “0 total XP”. *Why:* Seven rows that all say “nothing yet” are a lot to scan before the first level. The START button already says where to begin. *Fix:* Show the current lesson’s bar and “Lessons 2–7” as one line until they start. (You kept the 0 streak and 0 XP chips in the dev course, so those stay.) Screenshots: `ui-review/w1366-path-fresh.png` (Now, 1366). Dev course: like M1 / M7.
- **P2. The “Finish a level first” note follows you into a level** (S) Tapping Review before you have finished any level shows a dark note for 3 seconds. If you then start a level straight away, the note sits over the first learn card. *Why:* It covers the content at the moment the learning starts. *Fix:* Clear any note when the screen changes. Screenshots: `ui-review/w1366-learn-spreadsheet.png` (Now: the note over a learn card).

### Learn cards

- **L1. Laptop: bigger pictures on learn cards** (S) Some learn-card pictures are small on the laptop while the card has room to spare. On “text formatting” the toolbar buttons are drawn with about 11 px text and 12 px labels (Font, Size, Bold, Font colour). *Why:* The picture is half of the dual coding. If the labels need squinting, the words do all the work. *Fix:* Draw the toolbar pictures (`.tool-icons`, keycaps, step chips) 1.5× on screens 1024 px and wider, with labels at least 14 px. Screenshots: `ui-review/w1366-learn-text-formatting.png` (Now: text formatting, 1366).
- **L2. 1366: tall cards and screenshots slide under the bottom bar** (S–M) On the 1366×768 Chromebook, the “move and resize a chart” card runs under the bottom bar. In the chart-editor hotspot, the bottom of the screenshot (Switch rows/columns, the header tick boxes) is hidden behind the bar, with nothing to show that it scrolls. *Why:* What is hidden might be the answer to the next question, and nothing tells the student to scroll. *Fix:* Fit the picture to the height left, as `.shot--hot` already tries to do, counting the real height of a two-line question. Where it still doesn’t fit, add a soft fade and “more ↓” at the bottom edge. Screenshots: `ui-review/w1366-learn-move-resize-chart.png` (Now: the card under the bar); `ui-review/w1366-ex-hotspot-editor.png` (Now: the chart editor cut off). Dev course: #1 (below the fold), lighter.
- **L3. Say it once: definition and tip** (M (content)) On some cards the yellow tip repeats the definition. “move and resize a chart”: the definition says “Drag a corner to make it bigger or smaller”, and the tip says it again. *Why:* The redundancy effect: reading the same sentence twice costs attention and adds nothing. *Fix:* A content pass so that the tip adds something new: an example, a common mistake, or where to find it on a Chromebook. Screenshots: `ui-review/w1366-learn-move-resize-chart.png` (The tip repeats the definition). Dev course: L2, same idea.

### Exercises

- **E1. Chart choice on the phone: all three charts in view** (S–M) On the phone the three charts are stacked, and the third one (here the right one) is below the fold. The student can choose before ever seeing it. *Why:* Comparing the options is the whole exercise. *Fix:* Two columns of smaller charts, with the legend under each chart, or one row you swipe with “1 of 3” dots. Screenshots: `ui-review/phone-ex-chartchoice.png` (Now: the third chart is below the fold).
- **E2. Pie charts: bigger slice labels** (S–M) The percentages on the drawn pie charts are about 9–10 px, sit on top of the patterns, and small slices clip them (“7.6%” at the edge). *Why:* Reading the chart is the skill. The patterns are great for colour-blind students, but they make small text on top of them harder to read. *Fix:* Put the percentages in the legend (“Cake stall 41 %”), or outside the slice with a short line, at 13 px or more. Screenshots: `ui-review/w1366-learn-move-resize-chart.png` (Now: “7.6%” clipped); `ui-review/w1366-ex-chartchoice.png` (Now: labels on patterns).
- **E3. “Tap” on a laptop** (S) Many questions say “Tap the fill handle”, “Tap the steps…”, “Tap the legend” on the Chromebook too, while the kicker above says “Click it”. *Why:* It’s a small thing, but it’s the instruction, and the two words disagree. *Fix:* Use “Click” with a mouse and “Tap” on a touch screen (one helper that swaps the word), or a neutral “Choose”. Screenshots: `ui-review/w1366-fb-wrong-hotspot.png` (“Tap the fill handle” on a Chromebook).
- **E4. Press the keys: replace the grey “PRESS THE KEYS” button** (S) On key-shortcut questions the main button is a disabled grey “PRESS THE KEYS”. It looks like a button that doesn’t work. *Why:* Kids click it, nothing happens, and it’s not clear that the keyboard is the answer. *Fix:* Hide the main button on these steps and let the dashed key area say “Waiting for your keys…”. Keep “No keyboard?”. Screenshots: `ui-review/w1366-ex-keys.png` (Now, 1366); `ui-review/w1920-ex-keys.png` (Now, 1920). Dev course: #5 (a disabled CHECK that invites a click).
- **E5. Two ranges with Ctrl: on a laptop, a hint rather than a button** (S) In “Select two ranges” the laptop shows a big button-like box, “Ctrl · Hold Ctrl on your keyboard”. On the phone it really is a button (an on-screen Ctrl you tap). *Why:* On a laptop it looks clickable, and clicking it is not the skill: holding the real Ctrl is. *Fix:* With a mouse, show it as a plain hint with a keycap (no button border or shadow); keep the latch button on touch screens. Screenshots: `ui-review/w1366-ex-gridmulti.png` (Now, 1366).
- **E6. Match: keep the pair you mixed up readable** (S) When Match ends with a mix-up, every card fades to 45 % (1.97:1 contrast), so the sheet’s “You matched cell with…” points at cards that can no longer be read. *Why:* The mix-up is the thing to learn from. *Fix:* Keep the mixed-up pair at full strength with a coral outline, and fade only the others. Screenshots: `ui-review/w1366-fb-wrong-match.png` (Now: all faded). Dev course: #10 (faint text that carries meaning).
- **E7. Formulas with $: show the grid** (M (content)) “C2 holds =B2*$F$1. You fill it down to C5. Type the formula…” is text only, while the other formula questions show the sheet. *Why:* Seeing C2 to C5 and F1 makes the idea concrete; doing it in your head from text is extra load for a first attempt. *Fix:* Add the small grid with C2 selected and the fill range dashed, as in “Predict the fill”. Screenshots: `ui-review/w1366-fb-wrong-formula-lock.png` (Now: text only).

### Feedback and level complete

- **C1. Level complete: Continue right under the stats** (S) On the laptop, Continue is in the bottom-right corner, far from the stats and the “You practised” list (and far right of them at 1920). *Why:* The same as #4: one more trip across the screen. *Fix:* Follow whatever you pick in #4: right under “You practised”, or the bar lined up with the two columns. Screenshots: `ui-review/w1366-complete-1star.png` (Now, 1366); `ui-review/w1920-complete-level.png` (Now, 1920). Dev course: C1, same problem.
- **C2. Level complete: don’t count the streak up from 0** (S) The XP, first-try % and streak count up from 0. For the first half second the streak card says “0 day”. *Why:* A child who glances at it sees “0” for the thing they are proud of. *Fix:* Count up XP if you like, but show the streak (and the % ) straight away. Screenshots: `ui-review/w1366-complete-1star.png` (“0 day” while it counts).

### Review and My knowledge

- **K1. My knowledge: less repetition** (S–M) After the whole path, the list says “Getting there” on 70 rows, each with its own coloured badge, and the counts read “0 learnt · 70 getting there · 9 need review”. *Why:* A label that is on every row stops being read, and the yellow and coral badges pull the eye down the right edge instead of to the terms. *Fix:* A small three-step meter (one, two or three dots) with the word only on hover or tap, and colour only for “Needs review”. Explain once at the top that “Learnt” means right on three different days, so 0 learnt on day one is normal. Screenshots: `ui-review/w1366-knowledge.png` (Now, 1366); `ui-review/phone-knowledge.png` (Now, phone). Dev course: K2, same problem.

### Settings and the whole app

- **S1. Settings: the sound switch is 34 px tall** (S) The sound switch is 56×34 px on the phone. *Why:* Under the 44 px target size. *Fix:* Make the whole row the tap target (label and switch). Screenshots: `ui-review/phone-settings.png` (Now, phone). Dev course: S3, same problem.
- **S2. Settings: “Load my progress” summary as a short list** (S) Before replacing progress, Settings shows one long sentence: “This file (saved Nov 1) has Lesson 1: 6 of 6 levels done, Lesson 2: 4 of 4 levels done, …, 611 XP. Replace your current progress with it?”, with Reset progress just below. *Why:* This is the one moment a child can lose their work. It should be easy to see at a glance whether it is the right file. *Fix:* A list, one line per lesson with a tick for finished lessons, plus the XP and the date. Then the question in bold. Move Reset progress below a divider. Screenshots: `ui-review/w1366-settings-load.png` (Now).
- **G1. Screen readers hear “Area 1, Area 2…” on screenshots** (S) The tappable areas on real screenshots are labelled “Area 1”, “Area 2”… for screen readers. *Why:* A student who uses a screen reader can’t do these questions at all. *Fix:* Use the visible text as the label (“Sort range”, “Customise”, “the + button”): it’s on the screen anyway, so it gives nothing away. Screenshots: `ui-review/phone-ex-hotspot-menu.png` (Areas on a menu).

## Juan's answers (2 Nov 2026)

All 28 decided (27 OK or a chosen option, K1 Not OK). Nothing built yet.

- **1. Phone screenshots:** A, a zoomed crop per screen with a "whole screen" button (decided 2 Nov after the before/after pairs in `ui-review/pair-phone-*-pair.png`; earlier C was before seeing them).
- **2. Say it once after a wrong answer:** A, the definition goes behind a "What does it mean?" link.
- **3. Phone: keep what you chose in view after a wrong answer:** OK.
- **4. Laptop: Check and Continue near the content:** C, B on short screens (1366×768), A on tall ones.
- **5. Chromebook key badges:** A, letters on bank cards and word chips.
- **6. Phone: bigger cells and headers in the mini spreadsheet, no cut-off text:** OK.
- **7. Stop the motion that never ends:** OK.
- **8. Make Review look and end like Review:** OK.
- **9. Confetti:** A, only for three stars or a lesson's last level.
- **10. Skip:** A, a quiet "I don't know yet" text button on both laptop and phone.
- **P1. Day one: seven empty progress bars:** OK.
- **P2. "Finish a level first" note follows you into a level:** OK.
- **L1. Laptop: bigger pictures on learn cards:** OK.
- **L2. 1366: tall cards slide under the bottom bar:** OK.
- **L3. Say it once: definition and tip:** OK.
- **E1. Chart choice on the phone: all three charts in view:** OK.
- **E2. Pie charts: bigger slice labels:** OK.
- **E3. "Tap" on a laptop:** OK.
- **E4. Press the keys: replace the grey button:** OK.
- **E5. Two ranges with Ctrl: a hint on the laptop, not a button:** OK.
- **E6. Match: keep the mixed-up pair readable:** OK.
- **E7. Formulas with $: show the grid:** OK.
- **C1. Level complete: Continue right under the stats:** OK (follows #4: C).
- **C2. Level complete: don't count the streak up from 0:** OK.
- **K1. My knowledge: less repetition:** Not OK. Juan (2 Nov): leave My knowledge as it is for now.
- **S1. Settings: the whole sound row is the tap target:** OK.
- **S2. Settings: "Load my progress" summary as a short list:** OK.
- **G1. Screen readers: label hotspot areas with their visible text:** OK.

## Built and checked (2 Nov 2026)

Built in 12e3e81, e1cff77, 925ba29, 96707cd (not pushed). Juan checked the before/after page
(teaching_app/review/spreadsheets-ui-after.html): all 26 items with pictures OK; #7 (motion) not
answered, since it has no picture.
