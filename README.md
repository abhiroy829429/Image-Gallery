# Mini Image Gallery

A full-stack application for uploading, previewing, and managing images. Users can upload one JPEG or PNG image at a time (max 3 MB), view them instantly in a responsive gallery grid, and delete images as needed. Images are stored in backend memory.

## Demo

**[Live Demo](https://image-gallery-3.onrender.com/)**

![Mini Image Gallery Home Page](./frontend/src/assets/home%20page.png)

## Core Requirements

- ✅ Upload exactly one image at a time
- ✅ Supported types: JPEG, PNG
- ✅ Max file size: 3 MB
- ✅ Upload progress indicator
- ✅ Display uploaded images immediately in a gallery grid
- ✅ Delete functionality
- ✅ Backend stores images in memory (per assignment)
- ✅ No authentication required

## Tech Stack

- **Backend:** Node.js, Express.js, Multer
- **Frontend:** React, Vite
- **Storage:** In-memory (assignment requirement)

## Project Structure

```
Image_Gallery/
├── backend/
│   ├── src/
│   │   └── index.js          # Express API server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── assets/           # Images including demo screenshot
│   └── package.json
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev              # Starts on http://localhost:4000
```

**API Endpoints:**
- `GET /images` – List all uploaded images
- `POST /upload` – Upload a single image
- `DELETE /images/:id` – Delete an image by ID

### Frontend

```bash
cd frontend
npm install
npm run dev              # Starts on http://localhost:5173
```

To connect to a different backend, create `frontend/.env.local`:
```
VITE_API_BASE_URL=https://your-backend-url
```

## Features

- **One-click upload** with file picker
- **File validation** (type, size) with error feedback
- **Real-time progress** indicator during upload
- **Base64 image previews** in gallery cards
- **Delete with confirmation** messages
- **Responsive design** for all screen sizes
- **Auto-dismissing alerts** for success/error messages

## Design Notes

- Images stored in backend memory only; cleared on server restart
- Upload uses XMLHttpRequest for native progress events
- Frontend automatically switches between dev (`http://localhost:4000`) and production (`./`) API URLs
- Styling prioritizes clarity and usability

