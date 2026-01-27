import React from 'react';
import { Button, Input, Textarea } from './index';
import './AddServiceForm.css';

const AddServiceForm = ({ 
  service, 
  onChange, 
  onSubmit, 
  onCancel,
  isEditing = false,
  isLoading = false
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="add-service-form">
      <div className="add-service-form__header">
        <h2>
          {isEditing ? '✏️ Szolgáltatás szerkesztése' : '➕ Új szolgáltatás hozzáadása'}
        </h2>
        <p className="add-service-form__subtitle">
          {isEditing ? 'Frissítsd az adatokat' : 'Adj hozzá egy új szolgáltatást'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-service-form__form">
        <div className="add-service-form__grid">
          <Input
            label="Szolgáltatás neve *"
            type="text"
            placeholder="pl. Hajvágás, Hajfestés, Kozmetika..."
            value={service.service}
            onChange={(e) => onChange({ ...service, service: e.target.value })}
            required
            icon="✂️"
          />

          <Input
            label="Időtartam (perc) *"
            type="number"
            placeholder="30"
            value={service.duration}
            onChange={(e) => onChange({ ...service, duration: parseInt(e.target.value) || 0 })}
            min="15"
            step="15"
            required
            icon="⏱"
          />

          <Input
            label="Ár (Ft) *"
            type="number"
            placeholder="5000"
            value={service.price}
            onChange={(e) => onChange({ ...service, price: parseInt(e.target.value) || 0 })}
            min="0"
            required
            icon="💰"
          />

        <Input
          label="Kategória"
          type="text"
          placeholder="pl. Hajápolás, Arcápolás..."
          value={service.category || ''}
          onChange={(e) => onChange({ ...service, category: e.target.value })}
          icon="🏷️"
        />
      </div>

      <Textarea
        label="Leírás"
        placeholder="Rövid leírás a szolgáltatásról (opcionális)..."
        value={service.description || ''}
        onChange={(e) => onChange({ ...service, description: e.target.value })}
        icon="📝"
        rows={3}
      />        <div className="add-service-form__actions">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
          >
            {isEditing ? '💾 Frissítés' : '➕ Hozzáadás'}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onCancel}
              disabled={isLoading}
            >
              ✕ Mégse
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddServiceForm;
