# Mini Image Gallery

A simple full-stack assignment that lets users upload one image at a time (JPEG or PNG, up to 3 MB), view it immediately in a responsive gallery grid, and delete it when no longer needed. Images are stored only in backend memory.

## Tech Stack

- **Backend:** Node.js, Express, Multer (in-memory storage)
- **Frontend:** React (Vite)

## Project Structure

```
Image_Gallery/
├── backend/        # Express API
├── frontend/       # React client
└── README.md
```

## Backend

```
cd backend
npm install           # already run if cloned with node_modules ignored
npm run dev           # starts API on http://localhost:4000 with nodemon
```

### API Endpoints

- `GET /health` – service status
- `GET /images` – all uploaded images (id, filename, metadata, base64 data)
- `POST /upload` – upload a single `multipart/form-data` field named `image`
- `DELETE /images/:id` – delete an image from memory

Validation ensures exactly one file, MIME type (`image/jpeg` or `image/png`), and max size of 3 MB. Errors are returned with helpful messages.

## Frontend

```
cd frontend
npm install           # install deps if needed
npm run dev           # starts Vite dev server on http://localhost:5173
```

Set `VITE_API_BASE_URL` if your backend runs somewhere other than `http://localhost:4000`:

```
# frontend/.env.local
VITE_API_BASE_URL=https://your-hosted-backend.example
```

### Features

- Upload button that opens the file picker
- Validation for file type and size before uploading
- Progress indicator while uploading (uses XMLHttpRequest progress events)
- Instant gallery refresh with previews rendered via Base64 data URIs
- Delete action per image
- Responsive grid and polished styling designed for clarity over flair

## Notes & Trade-offs

- Images live only in memory; restarting the server clears them per assignment requirements.
- For production, a persistent store (S3, database) and authentication would be essential.
- Upload progress leverages `XMLHttpRequest` for browser-native progress events while keeping dependencies minimal.

## Testing & Verification

- Start backend (`npm run dev` inside `backend`) and ensure console logs show the server running on port 4000.
- Start frontend (`npm run dev` inside `frontend`) and open the printed URL.
- Upload a few small JPEG/PNG files (<3 MB) and delete them to confirm flows.
