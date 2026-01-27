import React from 'react';

const HeroBanner = ({ salonName, userName, onMenuToggle, showMenuToggle }) => {
  return (
    <section id="hero" className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.45)] px-5 py-8 sm:px-8 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(120,190,255,0.3),transparent_40%)] pointer-events-none" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-white/70">Üdv, {userName || 'Vendég'}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {salonName || 'Salon Dashboard'}
          </h1>
        </div>
        {showMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="self-end rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl shadow-lg hover:scale-[1.02] transition"
          >
            Menü
          </button>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
