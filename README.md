# justBeforExam

Run frontend (Next.js) and backend (FastAPI) together from the root folder.

## Option 1: Shell Script (macOS/Linux)

From project root:

```bash
chmod +x run.sh
./run.sh
```

What it does:
- Starts backend from `backend` with `uvicorn main:app --reload --port 8000`
- Starts frontend from `frontend` with `npm run dev`
- If `.venv` or `venv` exists in `backend`, it auto-activates it first
- On `Ctrl+C`, both processes are terminated together

## Option 2: Batch Script (Windows)

From project root in Command Prompt:

```bat
run.bat
```

What it does:
- Starts backend and frontend in parallel
- Uses backend virtual environment if present (`.venv` or `venv`)
- On `Ctrl+C`, both processes are cleaned up

## Option 3: Single npm Command (Optional)

An optional root `package.json` is included with `concurrently`.

Install root dependencies once:

```bash
npm install
```

Then run both servers:

```bash
npm start
```

This uses:
- `dev:backend` -> FastAPI server
- `dev:frontend` -> Next.js dev server
- `concurrently -k` so stopping one stops both
