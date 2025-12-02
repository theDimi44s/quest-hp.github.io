<!-- Copilot / AI agent instructions for the Quest static site -->
# Project-specific Copilot instructions

Purpose: Help an AI coding assistant be immediately productive in this small static "quest" site.

- **Big picture:** This is a tiny static web app. The single page `quest.html` loads an ES module `assets/js/quest.js` which fetches JSON files from `./quests/*.json` to render interactive, branching quests. There is no build system or package manager; the app runs by serving files over HTTP.

- **Key files:**
  - `quest.html` — single-page entry; loads `assets/js/quest.js` as a module.
  - `assets/js/quest.js` — core logic: loading JSON, rendering questions/results, navigation and progress.
  - `assets/css/styles.css` — visual styles.
  - `quests/*.json` — content files. See `quests/001.json` for the canonical schema.

- **Why this structure:** Content (quests) is separated from code as plain JSON so non-devs can author quests. The JS renderer expects a consistent shape (see JSON schema section) and uses `?id=XXX` query param to choose a quest file.

- **JSON schema (discoverable patterns):** Use these keys in `quests/<id>.json`:
  - `title` (string), `subtitle` (string) — shown in header.
  - `start` (integer) — index in `questions` for initial question (optional, default 0).
  - `questions` (array) — each question has `text` and `options` array. Each option may include:
    - `next` (integer) — index of next question
    - `goto` (string) — absolute or relative URL to navigate to
    - `result` (string key or object) — either key into `results` or an inline object
  - `results` (map) — keys map to objects with `title` and `text`.
  - Optional: `index.json` (not present by default) may provide `indexList` and `indexMeta` to render an ID selector.

- **Behavioral patterns the agent should preserve:**
  - Navigation is index-based (the renderer pushes numeric indices to `historyStack`). Preserve integer indices when adding questions.
  - `renderQuestion(idx)` expects `questData.questions[idx]` — don't change indexing semantics.
  - `handleOption` supports `next`, `goto`, and `result`. Add new behaviors only if backward-compatible.
  - Keyboard accessibility: options are `tabIndex=0` and respond to `Enter`/`Space` in `onkeydown` handlers.

- **Developer workflows / how to run / test locally:**
  - No build step. Serve the project directory over HTTP (the browser blocks module fetches via file://). Examples:
    - Python 3: `python3 -m http.server 8000` (from project root)
    - Node (npm): `npx serve .` or `npx http-server .`
  - Open `http://localhost:8000/quest.html?id=001` (or omit `id` to trigger index behavior).
  - Inspect network requests to `./quests/<id>.json` when debugging loading errors.

- **Editing conventions / code style notes:**
  - Keep UI strings (title, subtitles, button text) in Ukrainian where present.
  - `assets/js/quest.js` is a small ES module — prefer small, focused edits and preserve existing function boundaries (`loadQuest`, `renderQuestion`, `renderResult`, `renderStart`).
  - Avoid introducing heavy tooling (webpack, build step) unless the project grows; this repo intentionally remains static.

- **Examples to copy/update:**
  - Add a new question: append to `quests/001.json`'s `questions` array and use `next` as the numeric index (e.g., `"next": 3`).
  - Add a new result: add a key under `results` and reference it with `"result": "myKey"` in an option.
  - Provide an index file: `quests/index.json` with `{ "indexList": ["001","002"], "indexMeta": {"001": {"title":"..."} } }` to enable the selector page.

- **Integration points & external deps:**
  - External font: Google Fonts is loaded from the public web — no local bundling.
  - Uses `navigator.clipboard.writeText` for share links; guard for browsers without clipboard support.

- **When changing behavior:**
  - Keep backward compatibility with existing quest JSON files. When introducing new option properties, ensure the renderer falls back safely (e.g., treat unknown option properties as no-op).
  - Update `quests/README.md` or add inline examples in `.github/copilot-instructions.md` if you change the schema.

- **Testing checklist for PRs:**
  - Serve and open `quest.html?id=<modified-id>` and walk through the full flow (options, back, restart, share). 
  - Validate keyboard accessibility for options (Tab → Enter/Space triggers selection).
  - Check console/network for failed JSON loads; ensure `loadQuest` errors render a helpful message.

If anything in this file is unclear or you want additional examples (index format, more complex option behaviors, or seed generator scripts), tell me which part to expand.
