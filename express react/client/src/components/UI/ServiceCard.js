import React from 'react';
import { Button } from './Button';
import './ServiceCard.css';

const ServiceCard = ({ 
  service, 
  onEdit, 
  onDelete,
  showActions = true 
}) => {
  return (
    <article className="service-card">
      <div className="service-card__header">
        <div className="service-card__icon">
          ✂️
        </div>
        <div className="service-card__title-section">
          <h3 className="service-card__title">{service.service}</h3>
          {service.category && (
            <span className="service-card__category">{service.category}</span>
          )}
        </div>
        <div className="service-card__price">
          {service.price.toLocaleString('hu-HU')} Ft
        </div>
      </div>

      <div className="service-card__body">
        <div className="service-card__detail">
          <span className="service-card__detail-icon">⏱</span>
          <span className="service-card__detail-text">{service.duration} perc</span>
        </div>

        {service.description && (
          <p className="service-card__description">{service.description}</p>
        )}
      </div>

      {showActions && (
        <div className="service-card__footer">
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
            fullWidth
          >
            ✏️ Szerkesztés
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            fullWidth
          >
            🗑️ Törlés
          </Button>
        </div>
      )}
    </article>
  );
};

export default ServiceCard;
