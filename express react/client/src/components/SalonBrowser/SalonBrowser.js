import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SalonCard from './SalonCard';
import SalonFilters from './SalonFilters';
import axios from '../Dashboard/utils/axiosConfig';
import { useToast } from '../UI';
import './SalonBrowser.css';

const HeroIcon = ({ name }) => {
  switch (name) {
    case 'map':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z"
            opacity="0.3"
            fill="currentColor"
          />
          <circle cx="12" cy="10" r="2.8" fill="currentColor" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l1.6 5h5l-4 3 1.6 5-4.2-3.2L7.8 16 9.4 11 5.4 8h5z" fill="currentColor" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3l7 3v6c0 5-3.4 9.4-7 10-3.6-.6-7-5-7-10V6z"
            opacity="0.35"
            fill="currentColor"
          />
          <path
            d="M9 11l2 2 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" opacity="0.4" fill="currentColor" />
          <path
            d="M8 12h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

const sortSalonsBy = (list, key) => {
  const sorted = [...list];
  switch (key) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'hu-HU'));
    case 'reviews':
      return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    default:
      return sorted.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }
};

const SalonBrowser = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filters, setFilters] = useState({
    category: '',
    rating: 0,
    openNow: false,
    services: [],
  });

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get('/api/salons');
        const list = data.salons || [];
        setSalons(list);
      } catch (fetchError) {
        console.error('Hiba a szalonok betöltésekor:', fetchError);
        const errorMsg = 'Nem sikerült betölteni a szalonokat. Próbáld meg később újra.';
        setError(errorMsg);
        toast.error(errorMsg, { title: 'Hiba' });
        setSalons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, []);

  const filteredSalons = useMemo(() => {
    let result = [...salons];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((salon) => {
        const haystacks = [
          salon.name,
          salon.description,
          salon.tagline,
          salon.city,
          salon.district,
        ]
          .filter(Boolean)
          .map((value) => value.toLowerCase());

        const services = (salon.services || []).map((service) => service.toLowerCase());

        return (
          haystacks.some((value) => value.includes(term)) ||
          services.some((service) => service.includes(term))
        );
      });
    }

    if (filters.category) {
      result = result.filter((salon) => salon.category === filters.category);
    }

    if (filters.rating > 0) {
      result = result.filter((salon) => Number(salon.rating) >= filters.rating);
    }

    if (filters.openNow) {
      result = result.filter((salon) => salon.isOpen);
    }

    if (filters.services.length > 0) {
      result = result.filter((salon) =>
        filters.services.every((service) => (salon.services || []).includes(service))
      );
    }

    return sortSalonsBy(result, sortBy);
  }, [salons, searchTerm, filters, sortBy]);

  const totalSalons = salons.length;
  const openSalons = salons.filter((salon) => salon.isOpen).length;
  const averageRating =
    totalSalons > 0
      ? salons.reduce((sum, salon) => sum + (Number(salon.rating) || 0), 0) / totalSalons
      : 0;
  const districtCount = useMemo(() => {
    const uniqueDistricts = new Set(
      salons
        .map((salon) => salon.district)
        .filter((district) => typeof district === 'string' && district.trim().length > 0)
    );
    return uniqueDistricts.size;
  }, [salons]);

  const trendingServices = useMemo(() => {
    const counts = {};
    salons.forEach((salon) => {
      (salon.services || []).forEach((service) => {
        if (!service) return;
        counts[service] = (counts[service] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([service, count]) => ({ service, count }));
  }, [salons]);

  const heroHighlights = [
    {
      icon: 'map',
      title: districtCount ? `${districtCount}+ budapesti kerület` : 'Budapesti kerületek',
      description: 'Kerületre szabott ajánlások, hogy mindig közel maradj a vendégeidhez.',
    },
    {
      icon: 'spark',
      title: 'Valós vendégértékelések',
      description: 'Toplista hiteles review-kkal, prémium képi világgal és árinformációval.',
    },
    {
      icon: 'shield',
      title: 'Ellenőrzött adatforrás',
      description: 'Csak auditált szalonok kerülnek be a böngészőbe, folyamatos frissítéssel.',
    },
  ];

  const heroStats = [
    { label: 'Kurált szalon', value: totalSalons.toString().padStart(2, '0') },
    { label: 'Most is nyitva', value: openSalons.toString().padStart(2, '0') },
    {
      label: 'Átlag értékelés',
      value: totalSalons ? `${averageRating.toFixed(1)}/5` : '—',
    },
  ];

  const isLoadingInitial = loading && totalSalons === 0;

  const handleSearch = (term) => setSearchTerm(term);
  const handleFilterChange = (nextFilters) => setFilters(nextFilters);
  const handleSortChange = (event) => setSortBy(event.target.value);
  const handleSalonSelect = (salonSlug) => {
    if (!salonSlug) return;
    navigate(`/salon/${salonSlug}`);
  };
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: '',
      rating: 0,
      openNow: false,
      services: [],
    });
    setSortBy('rating');
  };

  return (
    <div className="salon-browser">
      <section className="salon-browser-hero">
        <div className="salon-browser-hero__eyebrow">Salon Browser · Live</div>
        <div className="salon-browser-hero__grid">
          <div className="salon-browser-hero__copy">
            <h1>Fedezd fel a város legkedveltebb szalonjait</h1>
            <p>
              Valós idejű adatvizualizáció, kimagasló értékelések és részletes szolgáltatáslisták
              az Overview szekció stílusában.
            </p>
            <div className="salon-browser-hero__stats">
              {heroStats.map((stat) => (
                <div key={stat.label} className="salon-browser-hero__stat">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="salon-browser-hero__panel">
            <span className="hero-panel__chip">Trendi fókusz</span>
            <h3>Legkeresettebb szolgáltatások</h3>
            <ul>
              {trendingServices.length > 0 ? (
                trendingServices.map((item) => (
                  <li key={item.service}>
                    <span>{item.service}</span>
                    <strong>{item.count} ajánlás</strong>
                  </li>
                ))
              ) : (
                <li className="hero-panel__empty">Adatok betöltése...</li>
              )}
            </ul>
          </div>
        </div>
        <div className="salon-browser-hero__highlights">
          {heroHighlights.map((highlight) => (
            <div key={highlight.title} className="salon-hero-highlight">
              <div className="salon-hero-highlight__icon">
                <HeroIcon name={highlight.icon} />
              </div>
              <div>
                <h4>{highlight.title}</h4>
                <p>{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="salon-browser-error">{error}</div>}

      <div className="salon-browser-content">
        <aside className="filters-sidebar">
          <SalonFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
          />
        </aside>

        <section className="salons-grid-container">
          <div className="results-info">
            <div>
              <p className="results-info__subtitle">Kurált találatok</p>
              <h2>{filteredSalons.length} szalon felel meg a szűrésnek</h2>
            </div>
            <div className="sort-options">
              <label htmlFor="salonSort">Rendezés</label>
              <select id="salonSort" value={sortBy} onChange={handleSortChange}>
                <option value="rating">Értékelés szerint</option>
                <option value="reviews">Vélemények száma</option>
                <option value="name">Név szerint</option>
              </select>
            </div>
          </div>

          <div className="salons-grid">
            {isLoadingInitial ? (
              <div className="salon-grid-skeleton">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="skeleton-card">
                    <div className="skeleton-thumb" />
                    <div className="skeleton-line w-60" />
                    <div className="skeleton-line w-80" />
                    <div className="skeleton-line" />
                  </div>
                ))}
              </div>
            ) : filteredSalons.length > 0 ? (
              filteredSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} onSelect={handleSalonSelect} />
              ))
            ) : (
              <div className="no-results">
                <h3>Nincs találat</h3>
                <p>Próbáld módosítani a keresést vagy töröld a beállított szűrőket.</p>
                <button onClick={clearFilters} className="btn primary" type="button">
                  Szűrők alaphelyzetbe
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalonBrowser;
