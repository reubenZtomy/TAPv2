This is the project for Student personality assesment application

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

The Vite dev server will run (by default at http://localhost:5173). In dev mode, the frontend calls the backend at `/api/hello` (same origin relative path) — when developing you may need to configure a proxy or run the frontend with the backend on the same host/port mapping (or call the full backend URL).

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

If you add a completely new question or screen, update the frontend code as well. For translation-only changes, adding the new `.txt` file is enough.

## Notes
- The frontend uses React + TypeScript with Vite. You can replace React with another framework if desired.
- The `backend/app.py` attempts to serve built frontend files from `frontend/dist` when available.
- If you want CORS during dev, the Flask app already enables CORS via `flask-cors`.
