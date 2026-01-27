// components/Dashboard/components/ImageUpload/ImageUpload.js
import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import './css/ImageUpload.css';

const resolvePreviewUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const base = (axios.defaults?.baseURL || '').replace(/\/$/, '');
  return `${base}${url}`;
};

const ImageUpload = ({ currentImage, onImageUpload, type = 'profile', entityId }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(resolvePreviewUrl(currentImage));
  const [error, setError] = useState('');

  useEffect(() => {
    setPreviewUrl(resolvePreviewUrl(currentImage));
  }, [currentImage]);

  const uploadToServer = async (file) => {
    const targetId = entityId || 'public';
    const normalizedType = type.toUpperCase();
    const formData = new FormData();
    formData.append('image', file);

    if (normalizedType === 'PROFILE') {
      formData.append('userId', targetId);
    } else if (normalizedType === 'LOGO' || normalizedType === 'FAVICON') {
      formData.append('salonId', targetId);
    } else if (normalizedType === 'HERO') {
      formData.append('pageId', targetId);
    } else {
      formData.append('entityId', targetId);
    }

    const { data } = await axios.post(
      `/api/assets/upload/${normalizedType.toLowerCase()}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    return data?.asset?.originalUrl || data?.asset?.variants?.[0]?.url || '';
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Csak képfájlok tölthetők fel!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('A kép mérete nem haladhatja meg az 5MB-ot!');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      const uploadedUrl = await uploadToServer(file);
      onImageUpload(uploadedUrl);
      setPreviewUrl(resolvePreviewUrl(uploadedUrl));
    } catch (error) {
      console.error('Képfeltöltési hiba:', error);
      setError(error.response?.data?.error || 'Hiba a kép feltöltése során');
      setUploading(false);
      return;
    }

    setUploading(false);
  };

  return (
    <div className="image-upload">
      <div className="image-preview">
        {previewUrl ? (
          <img src={previewUrl} alt="Előnézet" />
        ) : (
          <div className="image-placeholder">
            {type === 'profile' ? '👤' : '🏢'}
          </div>
        )}
      </div>

      <div className="upload-controls">
        <label className="btn secondary">
          {uploading ? 'Feltöltés...' : 'Kép választása'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        
        {previewUrl && !uploading && (
          <button 
            type="button" 
            className="btn danger"
            onClick={() => {
              setPreviewUrl(null);
              onImageUpload(null);
            }}
          >
            Kép eltávolítása
          </button>
        )}
      </div>

      {error && (
        <div className="message error" data-testid="upload-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
