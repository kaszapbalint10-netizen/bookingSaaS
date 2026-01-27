import React, { useState } from 'react';
import { Input, Button } from '../UI';

const categories = [
  { value: 'premium', label: 'Prémium', count: 12 },
  { value: 'luxury', label: 'Luxus', count: 8 },
  { value: 'standard', label: 'Standard', count: 18 },
  { value: 'eco', label: 'Fenntartható', count: 6 },
  { value: 'family', label: 'Családbarát', count: 10 },
  { value: 'barber', label: 'Barber', count: 7 },
  { value: 'express', label: 'Expressz', count: 5 },
];

const services = [
  'Hajvágás',
  'Hajfestés',
  'Melír',
  'Balayage',
  'Hajkezelés',
  'Smink',
  'Kozmetika',
  'Műköröm',
  'Masszázs',
  'Barber szolgáltatás',
  'Gyermek fodrász',
];

const ratings = [
  { value: 4.5, label: '4.5+ ★', count: 18 },
  { value: 4.0, label: '4.0+ ★', count: 32 },
  { value: 3.5, label: '3.5+ ★', count: 45 },
  { value: 3.0, label: '3.0+ ★', count: 52 },
];

const SalonFilters = ({ filters, onFilterChange, onClearFilters, searchTerm, onSearchChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleServiceToggle = (service) => {
    const nextServices = filters.services.includes(service)
      ? filters.services.filter((item) => item !== service)
      : [...filters.services, service];

    onFilterChange({
      ...filters,
      services: nextServices,
    });
  };

  const handleCategoryChange = (category) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? '' : category,
    });
  };

  const handleRatingChange = (rating) => {
    onFilterChange({
      ...filters,
      rating: filters.rating === rating ? 0 : rating,
    });
  };

  const handleOpenNowChange = (openNow) => {
    onFilterChange({
      ...filters,
      openNow,
    });
  };

  return (
    <div className="salon-filters">
      <div className="filters-header">
        <div>
          <p className="filters-eyebrow">Intelligens kereső</p>
          <h3>Szűrők</h3>
        </div>
        <button className="clear-filters-btn" onClick={onClearFilters} type="button">
          Összes törlése
        </button>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="salon-search">
          Keresés
        </label>
        <input
          id="salon-search"
          type="text"
          placeholder="Szalon neve, szolgáltatás, kerület..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Kategória</label>
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category.value}
              className={`category-btn ${filters.category === category.value ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.value)}
              type="button"
            >
              {category.label}
              <span className="category-count">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Minimum értékelés</label>
        <div className="rating-filters">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              className={`rating-btn ${filters.rating === rating.value ? 'active' : ''}`}
              onClick={() => handleRatingChange(rating.value)}
              type="button"
            >
              {rating.label}
              <span className="rating-count">({rating.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Nyitvatartás</label>
        <div className="checkbox-filters">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.openNow}
              onChange={(event) => handleOpenNowChange(event.target.checked)}
            />
            <span className="checkmark" />
            Csak nyitva lévő szalonok
          </label>
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-header-expandable">
          <label className="filter-label">Szolgáltatások</label>
          <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)} type="button">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>

        <div className={`services-filters ${isExpanded ? 'expanded' : ''}`}>
          {services.map((service) => (
            <label key={service} className="service-checkbox">
              <input
                type="checkbox"
                checked={filters.services.includes(service)}
                onChange={() => handleServiceToggle(service)}
              />
              <span className="checkmark" />
              {service}
            </label>
          ))}
        </div>
      </div>

      {(filters.category || filters.rating > 0 || filters.openNow || filters.services.length > 0) && (
        <div className="active-filters">
          <h4>Aktív szűrők</h4>
          <div className="active-filter-tags">
            {filters.category && (
              <span className="active-filter-tag">
                Kategória: {categories.find((item) => item.value === filters.category)?.label}
                <button onClick={() => handleCategoryChange('')} type="button">
                  ×
                </button>
              </span>
            )}
            {filters.rating > 0 && (
              <span className="active-filter-tag">
                Min. {filters.rating}★
                <button onClick={() => handleRatingChange(0)} type="button">
                  ×
                </button>
              </span>
            )}
            {filters.openNow && (
              <span className="active-filter-tag">
                Nyitva most
                <button onClick={() => handleOpenNowChange(false)} type="button">
                  ×
                </button>
              </span>
            )}
            {filters.services.map((service) => (
              <span key={service} className="active-filter-tag">
                {service}
                <button onClick={() => handleServiceToggle(service)} type="button">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonFilters;
