import { useEffect, useRef, useState } from 'react';
import './App.css';

// API base URL - use absolute URL in dev, empty string in production for relative URLs
const API_BASE_URL = import.meta.env.MODE === "development" 
  ? 'http://localhost:4000' 
  : ''; // Empty string means relative to current origin

// Helper to construct API URLs without double slashes
const getApiUrl = (endpoint) => {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png'];

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
};

function App() {
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  // timer ref for auto-dismissing messages
  const messageTimerRef = useRef(null);

  // helper to show a temporary message (auto clears after `ms`)
  const showTemporaryMessage = (type, msg, ms = 3000) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    setError('');
    setSuccess('');
    if (type === 'success') {
      setSuccess(msg);
    } else {
      setError(msg);
    }
    messageTimerRef.current = setTimeout(() => {
      setSuccess('');
      setError('');
      messageTimerRef.current = null;
    }, ms);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const totalBytes = images.reduce((sum, image) => sum + (image.size ?? 0), 0);
  const lastUploadedAt = images[0]?.uploadedAt;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/images'));
      if (!response.ok) {
        throw new Error('Unable to load images.');
      }
      const data = await response.json();
      setImages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateFile = (file) => {
    if (!file) {
      setError('Please pick an image to upload.');
      return false;
    }
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError('Only JPEG and PNG files are supported.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be 3 MB or smaller.');
      return false;
    }
    return true;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!validateFile(file)) {
      event.target.value = '';
      return;
    }
    setError('');
    setSuccess('');
    try {
      const uploadedImage = await uploadImage(file);
      setImages((prev) => [uploadedImage, ...prev]);
      showTemporaryMessage('success', `Uploaded ${uploadedImage.filename}`);
    } catch (err) {
      showTemporaryMessage('error', err.message ?? 'Upload failed.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const uploadImage = (file) =>
    new Promise((resolve, reject) => {
      setIsUploading(true);
      const xhr = new XMLHttpRequest();
      const uploadUrl = getApiUrl('/upload');
      console.log('Uploading to:', uploadUrl);
      xhr.open('POST', uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentage);
        }
      };

      xhr.onload = () => {
        console.log('Upload response status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log('Upload successful:', data.filename);
            resolve(data);
          } catch (parseError) {
            console.error('Parse error:', parseError);
            reject(new Error('Invalid server response.'));
          }
        } else {
          let message = 'Upload failed.';
          try {
            const errorData = JSON.parse(xhr.responseText);
            message = errorData.message || `Server returned status ${xhr.status}`;
          } catch (e) {
            message = `Server returned status ${xhr.status}: ${xhr.statusText}`;
          }
          console.error('Upload failed:', message);
          reject(new Error(message));
        }
      };

      xhr.onerror = () => {
        console.error('Network error during upload');
        reject(new Error('Network error during upload. Please check your connection.'));
      };

      xhr.onabort = () => {
        console.error('Upload aborted');
        reject(new Error('Upload was cancelled.'));
      };

      const formData = new FormData();
      formData.append('image', file);
      xhr.send(formData);
    });

  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(getApiUrl(`/images/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Unable to delete image.');
      }
      setImages((prev) => prev.filter((image) => image.id !== id));
      showTemporaryMessage('success', 'Image deleted.');
    } catch (err) {
      showTemporaryMessage('error', err.message);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        hidden
      />
      <header className="header">
        <div>
          <h1>Mini Image Gallery</h1>
          <p>Upload a single JPEG or PNG (max 3 MB) and manage your gallery.</p>
        </div>
        <button className="primary-button" onClick={openFilePicker}>
          Upload Image
        </button>
      </header>

      <section className="stats">
        <article className="stat-card">
          <p className="stat-card__label">Images Uploaded</p>
          <p className="stat-card__value">{images.length}</p>
          <span className="stat-card__hint">Current session only</span>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Storage Used</p>
          <p className="stat-card__value">{formatBytes(totalBytes)}</p>
          <span className="stat-card__hint">In-memory only</span>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Last Upload</p>
          <p className="stat-card__value">
            {lastUploadedAt
              ? new Date(lastUploadedAt).toLocaleTimeString()
              : '—'}
          </p>
          <span className="stat-card__hint">
            {lastUploadedAt ? new Date(lastUploadedAt).toLocaleDateString() : 'Awaiting first upload'}
          </span>
        </article>
      </section>

      {isUploading && (
        <section className="uploader">
          <div className="progress">
            <div
              className="progress__value"
              style={{ width: `${uploadProgress}%` }}
              aria-valuemin={0}
              aria-valuenow={uploadProgress}
              aria-valuemax={100}
            />
            <span>{uploadProgress}%</span>
          </div>
        </section>
      )}

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <section className="gallery">
        <div className="gallery__header">
          <h2>Uploaded Images</h2>
          <button className="secondary-button" onClick={fetchImages}>
            Refresh
          </button>
        </div>
        {isLoading ? (
          <p className="muted">Loading images…</p>
        ) : images.length === 0 ? (
          <p className="muted">No images yet. Upload one to get started.</p>
        ) : (
          <div className="grid">
            {images.map((image) => (
              <article key={image.id} className="card">
                <img
                  src={`data:${image.mimetype};base64,${image.data}`}
                  alt={image.filename}
                />
                <div className="card__body">
                  <div>
                    <p className="card__title">{image.filename}</p>
                    <p className="card__meta">
                      {formatBytes(image.size)} ·{' '}
                      {new Date(image.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="danger-button"
                    onClick={() => handleDelete(image.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
