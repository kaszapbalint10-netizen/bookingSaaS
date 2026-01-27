// components/Dashboard/sections/DataManagement/DataManagement.js
import React, { useState, useMemo } from 'react';
import axios from '../../utils/axiosConfig';
import './css/DataManagement.css';

const DataManagement = ({ user }) => {
  const [exportLoading, setExportLoading] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('PROFILE');
  const [assetEntityId, setAssetEntityId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const handleExport = async (type) => {
    setExportLoading(type);
    setMessage('');

    try {
      const response = await axios.get(`/api/dashboard/settings/export/${type}`, {
        responseType: 'blob'
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Fájlnév meghatározása
      const disposition = response.headers['content-disposition'] || '';
      const filename = disposition.split('filename=')[1]?.replace(/"/g, '') 
        || `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: `${type} exportálása sikeres` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Hiba az exportálás során' });
    } finally {
      setExportLoading('');
    }
  };

  const handleBackup = async () => {
    setMessage('');
    // Backup logika itt jönne
    setMessage({ type: 'success', text: 'Biztonsági mentés készítése elindítva' });
  };

  const handleRestore = async () => {
    setMessage('');
    // Restore logika itt jönne
    setMessage({ type: 'success', text: 'Adat visszaállítás elindítva' });
  };

  const assetOptions = useMemo(() => ([
    { value: 'PROFILE', label: 'Profil kép' },
    { value: 'HERO', label: 'Hero kép' },
    { value: 'LOGO', label: 'Szalon logó' },
    { value: 'FAVICON', label: 'Favicon' },
  ]), []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setUploadResult(null);
    setUploadError('');
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const getDefaultEntityId = () => {
    if (selectedAssetType === 'PROFILE') {
      return user?.id || user?._id || 'user-demo';
    }
    if (selectedAssetType === 'LOGO' || selectedAssetType === 'FAVICON') {
      return user?.salon_db || 'salon-demo';
    }
    if (selectedAssetType === 'HERO') {
      return 'landing-page';
    }
    return 'public';
  };

  const handleAssetUpload = async () => {
    if (!selectedFile) {
      setUploadError('Válassz ki egy fájlt a feltöltéshez.');
      return;
    }

    const targetId = assetEntityId.trim() || getDefaultEntityId();
    const formData = new FormData();
    formData.append('image', selectedFile);

    if (selectedAssetType === 'PROFILE') {
      formData.append('userId', targetId);
    } else if (selectedAssetType === 'LOGO' || selectedAssetType === 'FAVICON') {
      formData.append('salonId', targetId);
    } else if (selectedAssetType === 'HERO') {
      formData.append('pageId', targetId);
    } else {
      formData.append('entityId', targetId);
    }

    setUploading(true);
    setUploadResult(null);
    setUploadError('');

    try {
      const { data } = await axios.post(
        `/api/assets/upload/${selectedAssetType.toLowerCase()}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadResult(data.asset || data);
      setMessage({ type: 'success', text: 'Kép sikeresen feltöltve' });
    } catch (error) {
      console.error('Asset upload error:', error);
      setUploadError(error.response?.data?.error || 'Váratlan hiba történt.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="data-management">
      <h2>Adatkezelés</h2>
      
      <div className="settings-card">
        {/* Adatok exportálása */}
        <div className="data-section">
          <h3>📤 Adatok exportálása</h3>
          <p>Exportáld ki adataidat CSV formátumban további elemzéshez vagy biztonsági mentésként.</p>
          
          <div className="export-options">
            <div className="export-item">
              <h4>👥 Ügyfelek</h4>
              <p>Az összes regisztrált vendég adatai</p>
              <button 
                className="btn secondary"
                onClick={() => handleExport('clients')}
                disabled={exportLoading === 'clients'}
              >
                {exportLoading === 'clients' ? 'Exportálás...' : 'Ügyfelek exportálása'}
              </button>
            </div>

            <div className="export-item">
              <h4>📅 Foglalások</h4>
              <p>Minden időpontfoglalás részletes adatai</p>
              <button 
                className="btn secondary"
                onClick={() => handleExport('appointments')}
                disabled={exportLoading === 'appointments'}
              >
                {exportLoading === 'appointments' ? 'Exportálás...' : 'Foglalások exportálása'}
              </button>
            </div>
          </div>
        </div>

        {/* Biztonsági mentés */}
        <div className="data-section">
          <h3>💾 Biztonsági mentés</h3>
          <p>Készíts teljes biztonsági mentést a szalon adatairól.</p>
          
          <div className="backup-actions">
            <button className="btn primary" onClick={handleBackup}>
              Biztonsági mentés készítése
            </button>
            
            <button className="btn secondary" onClick={handleRestore}>
              Adat visszaállítása
            </button>
          </div>

        <div className="backup-info">
          <h4>Utolsó biztonsági mentések:</h4>
          <div className="backup-list">
            <div className="backup-item">
              <span>Nincs biztonsági mentés</span>
              <small>Még nem készült biztonsági mentés</small>
            </div>
          </div>
        </div>
      </div>

        {/* Asset feltöltés */}
        <div className="data-section asset-section">
          <h3>🖼️ Képek kezelése</h3>
          <p>Tölts fel új profilképet, hero képet, logót vagy favicont a szalon számára.</p>

          <div className="asset-upload-grid">
            <div className="asset-upload-card">
              <div className="form-row">
                <label>
                  Asset típusa
                  <select
                    value={selectedAssetType}
                    onChange={(e) => {
                      setSelectedAssetType(e.target.value);
                      setUploadResult(null);
                      setUploadError('');
                    }}
                  >
                    {assetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cél azonosító
                  <input
                    type="text"
                    placeholder={getDefaultEntityId()}
                    value={assetEntityId}
                    onChange={(e) => setAssetEntityId(e.target.value)}
                  />
                </label>
              </div>

              <label className="file-input">
                Kép kiválasztása
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>

              {previewUrl && (
                <div className="asset-preview">
                  <img src={previewUrl} alt="Előnézet" />
                </div>
              )}

              <button className="btn primary" onClick={handleAssetUpload} disabled={uploading}>
                {uploading ? 'Feltöltés...' : 'Kép feltöltése'}
              </button>

              {uploadError && <div className="message error">{uploadError}</div>}
            </div>

            {uploadResult && (
              <div className="asset-result-card">
                <h4>Feltöltés eredménye</h4>

                <div className="asset-result-section">
                  <p>Eredeti kép:</p>
                  <a href={uploadResult.originalUrl} target="_blank" rel="noreferrer">
                    {uploadResult.originalUrl}
                  </a>
                </div>

                <div className="asset-result-section">
                  <p>Generált variánsok:</p>
                  <ul>
                    {uploadResult.variants?.map((variant) => (
                      <li key={variant.name}>
                        <strong>{variant.name}</strong>{' '}
                        <a href={variant.url} target="_blank" rel="noreferrer">
                          megnyitás
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="asset-result-section metadata">
                  <p>Metaadatok:</p>
                  <pre>{JSON.stringify(uploadResult.metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adatvédelmi információk */}
        <div className="data-section">
          <h3>🛡️ Adatvédelem</h3>
          
          <div className="privacy-info">
            <div className="privacy-item">
              <strong>Adatmegőrzési időszak:</strong>
              <span>36 hónap</span>
            </div>
            
            <div className="privacy-item">
              <strong>Adattárolás helye:</strong>
              <span>Magyarország</span>
            </div>
            
            <div className="privacy-item">
              <strong>Adatfeldolgozás:</strong>
              <span>GDPR szerinti</span>
            </div>
          </div>

          <div className="privacy-actions">
            <button className="btn ghost">
              Adatvédelmi tájékoztató
            </button>
            
            <button className="btn ghost">
              Adattörlési kérelem
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default DataManagement;
