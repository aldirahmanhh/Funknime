import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import AnimeCarousel from './AnimeCarousel';
import Footer from './Footer';

const DAY_ORDER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, scheduleRes] = await Promise.all([
          animeAPI.getHome(),
          animeAPI.getSchedule().catch(() => null),
        ]);
        setHomeData(homeRes);
        if (scheduleRes?.data) setScheduleData(scheduleRes);
      } catch (err) {
        setError(err?.message ?? 'Gagal memuat data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="home-container main-container">
        <header className="page-header home-hero">
          <div className="skeleton skeleton-text" style={{ height: 40, width: 240 }} />
          <div className="skeleton skeleton-text" style={{ height: 20, width: 320, marginTop: 12 }} />
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: 120, height: 44 }} />
            <div className="skeleton" style={{ width: 100, height: 44 }} />
          </div>
        </header>
        <section className="section">
          <div className="skeleton skeleton-text" style={{ height: 28, width: 140, marginBottom: 20 }} />
          <SkeletonAnimeGrid count={6} />
        </section>
        <section className="section">
          <div className="skeleton skeleton-text" style={{ height: 28, width: 160, marginBottom: 20 }} />
          <SkeletonAnimeGrid count={6} />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden>⚠️</div>
        <p className="error-message">Gagal memuat anime: {error}</p>
        <p className="error-hint">Periksa koneksi internet atau coba lagi nanti.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Coba Lagi
        </button>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 8 }}>Kembali ke Beranda</Link>
      </div>
    );
  }

  const ongoing = homeData?.data?.ongoing?.animeList || [];
  const completed = homeData?.data?.completed?.animeList || [];
  const days = Array.isArray(scheduleData?.data) ? scheduleData.data : [];

  const renderSection = (title, animeList, linkPath, linkLabel, statusOverride) => {
    if (!animeList || animeList.length === 0) {
      return (
        <section className="section section-neo">
          <div className="section-header section-header-neo">
            <h2 className="section-title section-title-neo">{title}</h2>
            {linkPath && (
              <Link to={linkPath} className="view-all">{linkLabel || 'Lihat Semua'}</Link>
            )}
          </div>
          <div className="no-data">Belum ada anime</div>
        </section>
      );
    }
    return (
      <section className="section section-neo fade-in">
        <div className="section-header section-header-neo">
          <h2 className="section-title section-title-neo">{title}</h2>
          {linkPath && (
            <Link to={linkPath} className="view-all">{linkLabel || 'Lihat Semua →'}</Link>
          )}
        </div>
        <div className="anime-grid">
          {animeList.map((anime, idx) => (
            <AnimeCard key={anime.animeId ?? anime.slug ?? idx} anime={anime} index={idx} statusOverride={statusOverride} />
          ))}
        </div>
      </section>
    );
  };

  const popularList = ongoing.length >= 4 ? ongoing : [...ongoing, ...completed].slice(0, 10);

  return (
    <div className="home-container main-container">
      <header className="page-header home-hero">
        <h1 className="main-title text-gradient">Funknime – Streaming Anime Sub Indo</h1>
        <p className="subtitle">
          Situs streaming anime sub Indonesia. Katalog, jadwal, dan update episode terbaru untuk nonton anime online.
        </p>
        <div className="home-hero-actions">
          <Link to="/search" className="btn btn-primary">Cari anime</Link>
          <Link to="/schedule" className="btn btn-secondary">Jadwal</Link>
        </div>
        {popularList.length > 0 && (
          <AnimeCarousel items={popularList} title="Anime Populer" maxItems={12} />
        )}
      </header>

      {renderSection('Sedang Tayang', ongoing, '/ongoing', 'Buka daftar', 'Ongoing')}
      {renderSection('Baru Selesai', completed, '/completed', 'Lihat Semua', 'Completed')}

      {days.length > 0 && (
        <section className="section section-neo">
          <div className="section-header section-header-neo">
            <h2 className="section-title section-title-neo">Ringkasan jadwal mingguan</h2>
            <Link to="/schedule" className="view-all">Buka jadwal</Link>
          </div>
          <div className="schedule-summary">
            <table>
              <thead>
                <tr>
                  <th>Hari</th>
                  <th>Total</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {days
                  .sort((a, b) => {
                    const ai = DAY_ORDER.indexOf(a.day || '');
                    const bi = DAY_ORDER.indexOf(b.day || '');
                    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
                  })
                  .map((row) => {
                    const list = row.anime_list ?? row.animeList ?? [];
                    const count = list.length;
                    return (
                      <tr key={row.day}>
                        <td>{row.day}</td>
                        <td>{count} anime</td>
                        <td>
                          <Link to={`/schedule`} className="schedule-buka">Buka</Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;
