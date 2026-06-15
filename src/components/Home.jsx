import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import AnimeCarousel from './AnimeCarousel';
import Footer from './Footer';
import { getWatchHistory, formatTime } from '../utils/watchHistory';
import { mergeAnimeLists } from '../utils/animeUtils';

const DAY_ORDER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  const [donghuaData, setDonghuaData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchHistory, setWatchHistory] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [showDonatePopup, setShowDonatePopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, sameOngoingRes, sameCompletedRes, scheduleRes, donghuaOngoingRes, donghuaCompletedRes] = await Promise.all([
          animeAPI.getHome(),
          animeAPI.getOngoingSamehadaku().catch(() => null),
          animeAPI.getCompletedSamehadaku().catch(() => null),
          animeAPI.getSchedule().catch(() => null),
          animeAPI.getDonghuaOngoing(1).catch(() => null),
          animeAPI.getDonghuaCompleted(1).catch(() => null),
        ]);

        const otakOngoing = homeRes?.data?.ongoing?.animeList || [];
        const otakCompleted = homeRes?.data?.completed?.animeList || [];
        const sameOngoing = sameOngoingRes?.data?.animeList || [];
        const sameCompleted = sameCompletedRes?.data?.animeList || [];

        setHomeData({
          ongoing: mergeAnimeLists(otakOngoing, sameOngoing, 'Ongoing'),
          completed: mergeAnimeLists(otakCompleted, sameCompleted, 'Completed'),
        });
        setDonghuaData({ ongoing: donghuaOngoingRes?.ongoing_donghua || [], completed: donghuaCompletedRes?.completed_donghua || [] });
        if (scheduleRes?.data) setScheduleData(scheduleRes);
      } catch (err) {
        setError(err?.message ?? 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setWatchHistory(getWatchHistory());

    // Fetch Trakteer top donors via proxy
    fetch('/api/trakteer?action=supports&limit=10&page=1')
      .then(r => r.json())
      .then(d => {
        if (d?.result?.data) setTopDonors(d.result.data);
      })
      .catch(() => {
        // ignore — Trakteer is non-critical
      });

    // Show donate popup on every visit (delay 2s for smooth UX)
    const timer = setTimeout(() => setShowDonatePopup(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="home-container main-container">
        <header className="page-header home-hero">
          <div className="skeleton skeleton-text" style={{ height: 40, width: 240 }} />
          <div className="skeleton skeleton-text" style={{ height: 20, width: 320, marginTop: 12 }} />
        </header>
        <section className="section"><SkeletonAnimeGrid count={6} /></section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container main-container">
        <p className="error-message">Gagal memuat: {error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Coba Lagi</button>
      </div>
    );
  }

  const ongoing = homeData?.ongoing || [];
  const completed = homeData?.completed || [];
  const donghuaOngoing = donghuaData?.ongoing || [];
  const donghuaCompleted = donghuaData?.completed || [];
  const days = Array.isArray(scheduleData?.data) ? scheduleData.data : [];

  const buildRailItems = (animeList, statusOverride, isDonghua = false) =>
    (animeList || []).map((anime, idx) => {
      if (isDonghua) {
        return (
          <div className="home-rail-card" key={anime.slug ?? idx}>
            <AnimeCard anime={{ ...anime, animeId: anime.slug, provider: 'donghua' }} index={idx} statusOverride={statusOverride} providerHint="Donghua" />
          </div>
        );
      }
      const providers = anime.providers || (anime.provider ? [anime.provider] : []);
      const hasOtak = providers.includes('otakudesu');
      const hasSame = providers.includes('samehadaku');
      let providerHint = 'Otakudesu';
      if (hasOtak && hasSame) providerHint = 'Otakudesu & Samehadaku';
      else if (hasSame) providerHint = 'Samehadaku';
      return (
        <div className="home-rail-card" key={anime.animeId ?? anime.slug ?? idx}>
          <AnimeCard anime={{ ...anime, provider: hasOtak ? 'otakudesu' : (hasSame ? 'samehadaku' : anime.provider) }} index={idx} statusOverride={statusOverride} providerHint={providerHint} />
        </div>
      );
    });

  return (
    <div className="home-container main-container">
      {/* Donate Popup */}
      {showDonatePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }} onClick={() => setShowDonatePopup(false)}>
          <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-primary)', borderRadius: '20px', padding: '32px 28px', maxWidth: '440px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 0 40px rgba(147,51,234,0.3)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDonatePopup(false)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>☕</div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 900, marginBottom: '8px' }}>Suka MrFunk?</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: '20px', lineHeight: 1.7 }}>
              Kalau kamu suka nonton di sini, boleh dong trakteer kita biar makin semangat update! 💜
            </p>
            <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '10px', padding: '14px', fontSize: 'var(--text-base)', borderRadius: '12px' }}>
              ☕ Trakteer Sekarang
            </a>
            <button onClick={() => setShowDonatePopup(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', fontSize: 'var(--text-xs)', cursor: 'pointer', marginTop: '4px', padding: '8px' }}>Nanti aja deh →</button>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="page-header home-hero home-hero--streaming">
        <div className="home-hero-copy">
          <div className="home-hero-eyebrow">✨ Gratis · Tanpa Login · Multi-Provider</div>
          <h1 className="main-title text-gradient" data-text="MRFUNK">MRFUNK</h1>
          <p className="subtitle">Nonton anime &amp; donghua sub Indo. Semua provider, satu tempat.</p>
          <div className="home-hero-actions">
            <Link to="/search" className="btn btn-primary btn-large">🔍 Cari Anime</Link>
            <Link to="/ongoing" className="btn btn-secondary">📺 Sedang Tayang</Link>
          </div>
          <div className="home-hero-stats">
            <span className="home-stat"><strong>2</strong> Provider</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Donghua ✓</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Resume otomatis ✓</span>
          </div>
        </div>
        {ongoing.length > 0 && (
          <div className="home-hero-featured">
            <AnimeCarousel items={ongoing.slice(0, 8)} maxItems={8} />
          </div>
        )}
      </header>

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <section className="section home-rail">
          <div className="section-header home-rail-header">
            <h2 className="section-title">🕐 Lanjut Tonton</h2>
            <Link to="/history" className="view-all">Lihat semua</Link>
          </div>
          <div className="home-rail-scroll">
            {watchHistory.slice(0, 12).map((item, idx) => (
              <div className="home-rail-card" key={`${item.animeId}-${item.episodeId}-${idx}`}>
                <Link to={`/watch/${item.episodeId}`} state={{ provider: item.provider, backAnimeId: item.animeId }} className="anime-card card">
                  <div className="card-image-wrapper">
                    <span className="anime-card-badge anime-card-badge--ongoing">Lanjut</span>
                    {item.poster ? <img src={item.poster} alt={item.animeTitle} className="poster" loading="lazy" decoding="async" /> : <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>}
                    <div className="card-overlay"><span className="play-icon" aria-hidden>▶</span></div>
                    {item.currentTime > 0 && item.duration > 0 && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.15)', zIndex: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min((item.currentTime / item.duration) * 100, 100)}%`, background: 'var(--color-primary)', borderRadius: '0 2px 2px 0' }} />
                      </div>
                    )}
                  </div>
                  <div className="anime-info">
                    <h3>{item.animeTitle}</h3>
                    <div className="meta"><span className="episode-count">{item.episodeTitle || `Episode`}</span></div>
                    {item.currentTime > 0 && <div style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>⏱️ {formatTime(item.currentTime)}</div>}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Anime sections */}
      {ongoing.length > 0 && (
        <section className="section home-rail">
          <div className="section-header home-rail-header"><h2 className="section-title">🔥 Anime Sedang Tayang</h2><Link to="/ongoing" className="view-all">Lihat semua</Link></div>
          <div className="home-rail-scroll">{buildRailItems(ongoing, 'Ongoing')}</div>
        </section>
      )}
      {donghuaOngoing.length > 0 && (
        <section className="section home-rail">
          <div className="section-header home-rail-header"><h2 className="section-title">🐉 Donghua Sedang Tayang</h2><Link to="/donghua-ongoing" className="view-all">Lihat semua</Link></div>
          <div className="home-rail-scroll">{buildRailItems(donghuaOngoing, 'Ongoing', true)}</div>
        </section>
      )}
      {completed.length > 0 && (
        <section className="section home-rail">
          <div className="section-header home-rail-header"><h2 className="section-title">✅ Anime Baru Selesai</h2><Link to="/completed" className="view-all">Lihat semua</Link></div>
          <div className="home-rail-scroll">{buildRailItems(completed, 'Completed')}</div>
        </section>
      )}
      {donghuaCompleted.length > 0 && (
        <section className="section home-rail">
          <div className="section-header home-rail-header"><h2 className="section-title">🐉 Donghua Baru Selesai</h2><Link to="/donghua-completed" className="view-all">Lihat semua</Link></div>
          <div className="home-rail-scroll">{buildRailItems(donghuaCompleted, 'Completed', true)}</div>
        </section>
      )}

      {/* Schedule Summary */}
      {days.length > 0 && (
        <section className="section">
          <div className="section-header"><h2 className="section-title">📅 Jadwal Tayang</h2><Link to="/schedule" className="view-all">Buka jadwal</Link></div>
          <div className="schedule-summary-grid">
            {days.sort((a, b) => {
              const ai = DAY_ORDER.indexOf(a.day || '');
              const bi = DAY_ORDER.indexOf(b.day || '');
              return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
            }).map((row) => {
              const count = (row.anime_list ?? row.animeList ?? []).length;
              const todayIdx = new Date().getDay();
              const isToday = DAY_ORDER[todayIdx] === row.day;
              return (
                <Link
                  key={row.day}
                  to="/schedule"
                  className={`schedule-day-pill${isToday ? ' schedule-day-pill--today' : ''}`}
                >
                  {isToday && <span className="schedule-day-pill-dot" aria-hidden="true" />}
                  <span className="schedule-day-pill-name">{row.day}</span>
                  <span className="schedule-day-pill-count">{count}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Donatur Leaderboard */}
      {topDonors.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">💜 Top Donatur</h2>
            <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="view-all">Donasi juga →</a>
          </div>
          <div className="donor-list">
            {topDonors.slice(0, 5).map((donor, idx) => {
              const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              const rankClass = idx === 0 ? 'donor-rank--gold' : idx === 1 ? 'donor-rank--silver' : idx === 2 ? 'donor-rank--bronze' : '';
              return (
                <div key={donor.order_id || idx} className="donor-row">
                  <span className={`donor-rank ${rankClass}`} aria-label={`Peringkat ${idx + 1}`}>{rankIcon}</span>
                  <div className="donor-info">
                    <div className="donor-name">{donor.creator_name || 'Anonim'}</div>
                    {donor.support_message && <div className="donor-message">"{donor.support_message}"</div>}
                  </div>
                  <div className="donor-amount">
                    <div className="donor-quantity">{donor.quantity}× {donor.unit_name}</div>
                    <div className="donor-rupiah">Rp {(donor.amount || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              );
            })}
            <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="donor-cta-row">
              <span>☕ Trakteer MrFunk</span>
              <span className="donor-cta-arrow">→</span>
            </a>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;
