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

## Deployment on Render

### Prerequisites
- A Render account
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Steps

1. **Create a Web Service on Render:**
   - Go to your Render dashboard
   - Click "New +" → "Web Service"
   - Connect your repository

2. **Configure the Service:**
   - **Name:** `mini-image-gallery` (or your preferred name)
   - **Root Directory:** `backend` (important!)
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `PORT` = (Render will set this automatically)

3. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically:
     - Install dependencies
     - Run the build command (which builds the frontend)
     - Start the server

4. **Verify:**
   - Once deployed, visit your Render URL
   - The app should load and API routes should work
   - Check the logs in Render dashboard for any errors

### Troubleshooting

- **Upload not working:** Check Render logs for request details. The backend logs all requests.
- **404 errors:** Ensure `NODE_ENV=production` is set so static files are served correctly.
- **CORS errors:** The backend is configured to allow all origins in production.
- **Build failures:** Ensure the frontend builds successfully. Check that `backend/package.json` has the build script.

### Important Notes

- The backend serves both the API and the frontend static files in production
- API routes (`/upload`, `/images`, `/health`) are handled before static file serving
- The frontend automatically uses relative URLs (`./`) in production mode
- All images are stored in memory and will be lost on server restart
