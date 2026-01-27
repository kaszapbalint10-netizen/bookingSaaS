import React from 'react';
import axios from '../Dashboard/utils/axiosConfig';
import { Button, useToast } from '../UI';

const buildAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const base = (axios.defaults?.baseURL || '').replace(/\/$/, '');
  return `${base}${url}`;
};

const Icon = ({ name }) => {
  switch (name) {
    case 'location':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s-6.5-5-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 16 12 21 12 21z"
            fill="currentColor"
            opacity="0.2"
          />
          <circle cx="12" cy="10.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22 17v3a2 2 0 0 1-2.2 2A18.8 18.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.4 2L9 10.4a16 16 0 0 0 4.6 4.6l1.2-1.2a2 2 0 0 1 2-.4 12 12 0 0 0 2.5.6A2 2 0 0 1 22 17z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'team':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="4" fill="currentColor" opacity="0.2" />
          <path
            d="M15 14a5 5 0 0 0-10 0v3h10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="18"
            cy="7"
            r="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity="0.5"
          />
          <path
            d="M23 18v-2.2a4.2 4.2 0 0 0-3.1-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    case 'arrow':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" opacity="0.2" fill="currentColor" />
        </svg>
      );
  }
};

const Star = ({ filled }) => (
  <svg viewBox="0 0 24 24" className={`icon-star ${filled ? 'filled' : ''}`} aria-hidden="true">
    <path d="M12 3.6l2.4 4.8 5.3.8-3.9 3.8.9 5.5L12 15.8 7.3 18.5l.9-5.5-3.9-3.8 5.3-.8z" />
  </svg>
);

const getCategoryLabel = (category) => {
  const categories = {
    luxury: 'Luxus',
    premium: 'Prémium',
    standard: 'Standard',
    eco: 'Fenntartható',
    family: 'Családbarát',
    barber: 'Barber',
    express: 'Expressz',
  };
  return categories[category] || category;
};

const SalonCard = ({ salon, onSelect }) => {
  const toast = useToast();
  const heroImage =
    buildAssetUrl(salon.heroImage || salon.thumbnailImage) || '/images/salon-placeholder.jpg';
  const services = salon.services || [];
  const ratingValue = Number(salon.rating) || 0;
  const fullStars = Math.floor(ratingValue);

  const renderPriceRange = () => {
    const ranges = {
      $: 'Elérhető',
      $$: 'Középkategória',
      $$$: 'Prémium',
      $$$$: 'Luxus+',
      $$$$$: 'Exkluzív',
    };
    if (!salon.priceRange) {
      return <span className="price-chip muted">Árkategória: nincs adat</span>;
    }
    return (
      <span className="price-chip">
        {salon.priceRange} · {ranges[salon.priceRange] || 'Árkategória'}
      </span>
    );
  };

  const handleSelect = () => {
    onSelect?.(salon.slug);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <article
      className="salon-card"
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      aria-label={`Részletek megnyitása: ${salon.name}`}
    >
      <div
        className="salon-card__media"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,.15), rgba(15,23,42,.85)), url(${heroImage})`,
        }}
      >
        <div className="salon-card__media-top">
          <div className="chips">
            <span className={`status-chip ${salon.isOpen ? 'open' : 'closed'}`}>
              {salon.isOpen ? 'Nyitva' : 'Zárva'}
            </span>
            <span className="category-chip">{getCategoryLabel(salon.category)}</span>
          </div>
          <div className="rating-chip">
            <div className="stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} filled={index < fullStars} />
              ))}
            </div>
            <div className="rating-value">
              <strong>{ratingValue.toFixed(1)}</strong>
              <small>{salon.reviews || 0} értékelés</small>
            </div>
          </div>
        </div>
        {salon.tagline && <p className="hero-tagline">{salon.tagline}</p>}
      </div>

      <div className="salon-card__body">
        <div className="salon-card__title">
          <h3>{salon.name}</h3>
          {salon.description && <p>{salon.description}</p>}
        </div>

        <div className="salon-card__meta">
          <div className="meta-item">
            <span className="icon-wrapper">
              <Icon name="location" />
            </span>
            <span>{salon.address}</span>
          </div>
          <div className="meta-item">
            <span className="icon-wrapper">
              <Icon name="phone" />
            </span>
            <span>{salon.phone || 'Nincs telefonszám megadva'}</span>
          </div>
          <div className="meta-item">
            <span className="icon-wrapper">
              <Icon name="team" />
            </span>
            <span>{salon.staffCount || 0} szakember</span>
          </div>
        </div>

        <div className="salon-card__chips-row">
          {renderPriceRange()}
          <span className="city-chip">
            {salon.city} · {salon.district || 'Központ'}
          </span>
        </div>

        {services.length > 0 && (
          <div className="salon-card__services">
            {services.slice(0, 3).map((service, index) => (
              <span key={service || index} className="service-chip">
                {service}
              </span>
            ))}
            {services.length > 3 && (
              <span className="service-chip more">+{services.length - 3} további</span>
            )}
          </div>
        )}

        <div className="salon-card__actions">
          <Button
            variant="primary"
            type="button"
            onClick={handleSelect}
            fullWidth
          >
            Részletek megtekintése
            <span className="icon-wrapper">
              <Icon name="arrow" />
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default SalonCard;
