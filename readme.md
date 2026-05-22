This is the project for Student personality assesment application

## Repository (V2)

This codebase is published as **TAP V2** at [https://github.com/reubenZtomy/TAPv2](https://github.com/reubenZtomy/TAPv2.git). It is separate from the original client repository ([TAP](https://github.com/reubenZtomy/TAP)). Push V2 changes to the `tapv2` remote only:

```bash
git push tapv2 main
```

## Project scaffold

This workspace now contains a minimal Flask backend and a Vite + React + TypeScript frontend scaffold.

Layout added:
- `backend/` - Flask app and `requirements.txt`.
- `frontend/` - Vite + React + TypeScript project skeleton.

## How to run (development)

1) Backend (Flask)

Create a virtual environment and install dependencies, then run the app:

```bash
# from repository root
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/app.py
```

This starts the backend at http://127.0.0.1:5000 and exposes `/api/hello`.

2) Frontend (dev server)

From the `frontend/` folder install dependencies and run the dev server:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will run (by default at http://localhost:5173). In dev mode, the frontend proxies `/api` to the Flask backend at http://127.0.0.1:5000.

**Language selector:** On the title screen, the user picks a language from the dropdown. The app saves that choice in the browser (`localStorage`, key `asq_language`). The next time the project is opened or the page is refreshed, the same language is selected automatically and its quiz copy is loaded from the backend.

### Internal result-screen preview (client / QA)

The normal app URL does **not** show the personality result test panel. To preview all eight result layouts without completing the quiz, open this secret path (not linked from the UI):

**Development (Vite):**

http://localhost:5173/asq-internal-preview-8f3c2a9e1b7d4m6p2q0w5x

**Production-like (Flask serving the built frontend):**

http://127.0.0.1:5000/asq-internal-preview-8f3c2a9e1b7d4m6p2q0w5x

Use the **Test results** buttons beside the phone frame to open each personality screen with sample content. The main quiz flow is unchanged at `/` (or http://localhost:5173/ in dev).

The path is defined in `frontend/src/config/devPreviewRoute.ts` if it ever needs to be changed.

## How to run (production-like)

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Start the Flask app (it will serve `frontend/dist` if present):

```bash
# from repo root
source .venv/bin/activate
python backend/app.py
```

## Personality result & university recommendations

The app generates a personality result and matching Australian university recommendations using the Groq AI API. This is handled by `backend/result_engine.py` and exposed via the `/api/generate-result` endpoint (POST).

How it works:
1. The frontend sends the user's quiz answers (including their `passion` / field of study) as JSON.
2. The backend matches the answers to one of 8 personality profiles (e.g. City Visionary, Mindful Learner).
3. It then recommends the top 3 Australian universities that fit the personality and chosen field of study.

Setup requirements:
- Add a `GROQ_API_KEY` to `backend/.env`. Optionally set `GROQ_MODEL` (defaults to `llama-3.3-70b-versatile`).
- The university data file `backend/australian_universities_2026.xlsx` must be present in the `backend/` folder. The engine reads the "University Data 2026" sheet on startup.
- Requires `pandas` and `openpyxl` (included in `requirements.txt`) to read the Excel file.

Example request body:

```json
{
  "passion": "Engineering",
  "partner": "Kangaroo Jumper",
  "treasure": "Endless Gold",
  "funBalance": "All Work, No Play",
  "basecamp": "Big and Creative City Life",
  "downtime": "City Explorer",
  "rankingView": "Top 100 or bust!",
  "afterGraduation": "Power Up Your Knowledge"
}
```

## How to add a new language

Language content is loaded from `.txt` files in `backend/questions/`. Each file must contain valid JSON, and the file name is used as the language name shown in the app.

1. Copy an existing language file, for example `backend/questions/English.txt`.

2. Rename the copy to the new language name:

```text
backend/questions/Spanish.txt
backend/questions/French.txt
backend/questions/Nepali.txt
```

3. Translate the text values inside the file, but keep the JSON structure and keys the same:
- Keep the top-level sections: `title`, `ui`, and `questions`.
- Keep question IDs such as `passion`, `partner`, `treasure`, `fun`, `basecamp`, `adventure`, `recharge`, and `graduation`.
- Keep each option `key` unchanged, because the app uses these keys internally.
- Translate only user-facing values such as `heading`, `subtitle`, `startButton`, `question`, and option `label`.
- Use `\n` inside strings when a label needs a line break.

4. Make sure the file is valid JSON:
- Use double quotes around all keys and strings.
- Do not add trailing commas.
- Save the file as UTF-8 so non-English characters display correctly.

5. Restart the Flask backend after adding the file:

```bash
python backend/app.py
```

6. Open the app and check the title screen language selector. The new language should appear automatically because the backend reads all `.txt` files from `backend/questions/`.

**Remembering the last language:** When a user selects a language on the title screen, it is stored in the browser. On the next visit (after closing the tab, restarting the dev servers, or reloading the page), the dropdown opens on that language and the app loads its question content from `/api/questions/{language}`. If the saved language is no longer available (for example the file was removed), the app falls back to the first language in the list.

If you add a completely new question or screen, update the frontend code as well. For translation-only changes, adding the new `.txt` file is enough.

## Notes
- The frontend uses React + TypeScript with Vite. You can replace React with another framework if desired.
- The `backend/app.py` attempts to serve built frontend files from `frontend/dist` when available.
- If you want CORS during dev, the Flask app already enables CORS via `flask-cors`.