#!/usr/bin/env bash
# Copy the Knowledge Bank files into the app, then check the app's content.
#
#   tools/sync_content.sh          copy ../spreadsheets/knowledge_lessonN.js → content/
#   tools/sync_content.sh --xlsx   first run Juan's sync (xlsx → knowledge_lessonN.js), then copy
#
# The knowledge files are copied byte for byte: never edit content/knowledge_*.js
# by hand. Edit spreadsheets_knowledge_list.xlsx and run this again.
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${SPREADSHEETS_DIR:-$APP/../spreadsheets}"
LESSONS="$(node --no-warnings -e 'import(process.argv[1]).then(m=>console.log(m.course.lessons.filter(l=>!l.comingSoon).map(l=>l.n).join(" ")))' "$APP/content/course.js")"

if [[ "${1:-}" == "--xlsx" ]]; then
  echo "Running sync_knowledge.py (xlsx → knowledge files)…"
  (cd "$SRC/.." && .venv/bin/python spreadsheets/sync_knowledge.py)
fi

for n in $LESSONS; do
  cp "$SRC/knowledge_lesson$n.js" "$APP/content/knowledge_lesson$n.js"
  echo "copied knowledge_lesson$n.js"
done

node --no-warnings "$APP/tools/check_content.mjs"
