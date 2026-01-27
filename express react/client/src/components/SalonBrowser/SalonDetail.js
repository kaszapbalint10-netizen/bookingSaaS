import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../Dashboard/utils/axiosConfig";
import { Button, useToast } from "../UI";
import { format } from "date-fns";
import "./SalonBrowser.css";

const buildAssetUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const base = (axios.defaults?.baseURL || "").replace(/\/$/, "");
  return `${base}${url}`;
};

const InfoRow = ({ label, value, icon }) => (
  <div className="detail-info-row">
    <div className="detail-info-icon">{icon}</div>
    <div>
      <p className="detail-info-label">{label}</p>
      <p className="detail-info-value">{value || "Nincs adat"}</p>
    </div>
  </div>
);

const SalonDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axios.get(`/api/salons/${slug}`);
        setSalon(data.salon);
      } catch (err) {
        console.error("Salon detail fetch error", err);
        const msg = "Nem sikerült betölteni a szalon adatait.";
        setError(msg);
        toast.error(msg, { title: "Hiba" });
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDetail();
    }
  }, [slug, toast]);

  const heroImage = useMemo(() => {
    if (!salon) return "";
    return buildAssetUrl(salon.heroImage || salon.thumbnailImage || "/images/salon-placeholder.jpg");
  }, [salon]);

  const priceText = useMemo(() => {
    if (!salon?.priceRange) return "Árkategória: nincs adat";
    return `Árkategória: ${salon.priceRange}`;
  }, [salon]);

  // Heti nézet: kezdő hét mozgatása előre / hátra, vissza csak az aktuális hétig
  const initialMonday = useMemo(() => {
    const today = new Date();
    const day = today.getDay() || 7; // hétfő=1
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const [weekStart, setWeekStart] = useState(initialMonday);

  const weekDays = useMemo(() => {
    const ohMap = salon?.openHours || {};
    const pad = (v) => v.toString().padStart(2, "0");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const label = format(d, "MMM d.");
      const raw = (ohMap[key] || "").trim();
      const breakMatch = raw.match(/s.?net:\s*([0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2})/i);
      const breakValue = breakMatch ? breakMatch[1] : null;
      let value = raw.replace(/\(.*?s.?net:.*?\)/i, "").trim();
      if (!value) value = "Zárva";
      if (/^Z.?rva$/i.test(value)) value = "Zárva";
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
      return { key, label, value, breakValue, isToday };
    });
  }, [salon, weekStart]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `${format(weekStart, "yyyy. MMM d.")} - ${format(end, "yyyy. MMM d.")}`;
  }, [weekStart]);

  if (loading) {
    return (
      <div className="salon-detail loading">
        <div className="salon-detail__skeleton">
          <div className="skeleton hero" />
          <div className="skeleton line" />
          <div className="skeleton line" />
          <div className="skeleton grid" />
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="salon-detail">
        <div className="salon-detail__error">
          <p>{error || "A szalon nem található."}</p>
          <Button variant="primary" onClick={() => navigate("/salons")}>
            Vissza a keresőbe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="salon-detail">
      <header
        className="salon-detail__hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(6,9,18,0.2), rgba(6,9,18,0.78)), url(${heroImage})`,
        }}
      >
        <div className="salon-detail__hero-top">
          <Button variant="ghost" onClick={() => navigate("/salons")}>
            ← Vissza
          </Button>
          <span className={`status-chip ${salon.isOpen ? "open" : "closed"}`}>
            {salon.isOpen ? "Nyitva" : "Zárva"}
          </span>
        </div>
        <div className="salon-detail__hero-main">
          <div>
            <p className="hero-eyebrow">Salon Browser</p>
            <h1>{salon.name}</h1>
            {salon.tagline && <p className="hero-tagline">{salon.tagline}</p>}
            <div className="hero-chips">
              <span className="category-chip">{salon.category || "Kategória nélkül"}</span>
              <span className="price-chip">{priceText}</span>
              <span className="city-chip">
                {salon.city} – {salon.district || "Központ"}
              </span>
            </div>
          </div>
          <div className="hero-rating">
            <div className="rating-value">
              <strong>{(Number(salon.rating) || 0).toFixed(1)}</strong>
              <small>{salon.reviews || 0} értékelés</small>
            </div>
          </div>
        </div>
      </header>

      <main className="salon-detail__content">
        <section className="detail-card">
          <h2>Leírás</h2>
          <p className="detail-description">{salon.description || "Nincs leírás megadva."}</p>
          {salon.services?.length ? (
            <div className="detail-tags">
              {salon.services.map((service, idx) => (
                <span key={idx} className="service-chip">
                  {service}
                </span>
              ))}
            </div>
          ) : null}
          {salon.amenities?.length ? (
            <>
              <h3>Felszereltség</h3>
              <div className="detail-tags muted">
                {salon.amenities.map((amenity, idx) => (
                  <span key={idx} className="service-chip">
                    {amenity}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="detail-grid">
          <div className="detail-card">
            <h3>Elérhetőségek</h3>
            <InfoRow label="Cím" value={salon.address} icon={<span>📍</span>} />
            <InfoRow label="Telefon" value={salon.phone || "Nincs telefonszám"} icon={<span>📞</span>} />
            <InfoRow label="E-mail" value={salon.email || "Nincs e-mail"} icon={<span>✉️</span>} />
            <InfoRow label="Weboldal" value={salon.website || "Nincs weboldal"} icon={<span>🌐</span>} />
            <InfoRow label="Személyzet" value={`${salon.staffCount || 0} fő`} icon={<span>👥</span>} />
          </div>

          <div className="detail-card detail-hours-card">
            <h3>Nyitvatartás</h3>
            <div className="week-header">
              <Button
                variant="ghost"
                disabled={weekStart <= initialMonday}
                onClick={() => {
                  if (weekStart <= initialMonday) return;
                  setWeekStart(new Date(weekStart.getTime() - 7 * 86400000));
                }}
              >
                ← Előző hét
              </Button>
              <span className="week-range">{weekLabel}</span>
              <Button variant="ghost" onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000))}>
                Következő hét →
              </Button>
            </div>
            <div className="open-hours-grid">
              {weekDays.map((item) => (
                <div key={item.key} className={`open-hour-row ${item.isToday ? "is-today" : ""}`}>
                  <span className="day">{item.label}</span>
                  <span className="hours">{item.value}</span>
                  {item.breakValue ? (
                    <div className="break">
                      <span className="break-label">Szünet</span>
                      <span className="break-time">{item.breakValue}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SalonDetail;
