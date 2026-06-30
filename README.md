# Career Alignment Agent Frontend

React + Vite workflow console for job ingestion, job pipeline review, matching, and truthful resume tailoring.

## Quick Start

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API root. The default expects the backend at `http://127.0.0.1:8000/api/v1`.

## Workflow Surface

- Add profile evidence with stable source IDs.
- Ingest pasted jobs, URLs, or query-provider placeholders.
- Review matched jobs in the pipeline list.
- Edit selection source items, section order, page target, gaps, and raw JSON before approval.
- Generate bounded placeholder content, compile the PDF, and approve the final artifact.

## Scripts

- `npm run dev`: start Vite.
- `npm run build`: type-check and build.
- `npm run preview`: preview the production build.
