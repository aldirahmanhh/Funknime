import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI, comicAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import AnimeCarousel from './AnimeCarousel';
import Footer from './Footer';
import { getWatchHistory, formatTime } from '../utils/watchHistory';
import { mergeAnimeLists } from '../utils/animeUtils';

const DAY_ORDER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ── Inline Komik card for homepage ──
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};
const placeholderImg = (text) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">` +
    `<rect width="200" height="280" fill="#1a1a26"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#9333EA" font-family="sans-serif" font-size="14" font-weight="bold">` +
    (text || 'Komik').substring(0, 16) +
    `</text></svg>`
  )}`;

const HomeKomikCard = ({ comic }) => {
  const { slug, title, poster, chapter, type, rating } = comic;
  const posterUrl = poster ? proxyImage(poster) : placeholderImg(title);
  return (
    <Link to={`/komik/${slug}`} className="anime-card card" title={title}>
      <div className="card-image-wrapper">
        {type && <span className="anime-card-badge anime-card-badge--ongoing">{type}</span>}
        <img
          src={posterUrl}
          alt={title}
          className="poster"
          loading="lazy"
          decoding="async"
          width={200}
          height={280}
          referrerPolicy="no-referrer"
          onError={(e) => { const f = placeholderImg(title); if (e.target.src !== f) e.target.src = f; }}
        />
        <div className="card-overlay"><span className="play-icon" aria-hidden="true">📖</span></div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {chapter && <span className="episode-count">{chapter}</span>}
          {rating && <span className="score">⭐ {rating}</span>}
        </div>
      </div>
    </Link>
  );
};

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  const [donghuaData, setDonghuaData] = useState(null);
  const [komikData, setKomikData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchHistory] = useState(() => getWatchHistory());
  const [topDonors, setTopDonors] = useState([]);
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [komikLoading, setKomikLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Phase 1: Fetch only what's above-the-fold (hero: anime ongoing)
    const fetchCritical = async () => {
      try {
        const homeRes = await animeAPI.getHome();
        if (cancelled) return;

        const otakOngoing = homeRes?.data?.ongoing?.animeList || [];
        const otakCompleted = homeRes?.data?.completed?.animeList || [];

        setHomeData({ ongoing: otakOngoing, completed: otakCompleted });
        setLoading(false);

        // Phase 2: After first paint, merge secondary + donghua
        requestIdleCallback(
          () => { if (!cancelled) fetchSecondary(otakOngoing, otakCompleted); },
          { timeout: 2000 },
        );

        // Phase 3: Komik (lowest priority, below fold)
        requestIdleCallback(
          () => { if (!cancelled) fetchKomik(); },
          { timeout: 4000 },
        );
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'Gagal memuat data');
        setLoading(false);
      }
    };

    const fetchSecondary = async (otakOngoing, otakCompleted) => {
      const [sameOngoingRes, sameCompletedRes, scheduleRes, donghuaOngoingRes, donghuaCompletedRes] = await Promise.all([
        animeAPI.getOngoingSamehadaku().catch(() => null),
        animeAPI.getCompletedSamehadaku().catch(() => null),
        animeAPI.getSchedule().catch(() => null),
        animeAPI.getDonghuaOngoing(1).catch(() => null),
        animeAPI.getDonghuaCompleted(1).catch(() => null),
      ]);
      if (cancelled) return;

      const sameOngoing = sameOngoingRes?.data?.animeList || [];
      const sameCompleted = sameCompletedRes?.data?.animeList || [];

      setHomeData({
        ongoing: mergeAnimeLists(otakOngoing, sameOngoing, 'Ongoing'),
        completed: mergeAnimeLists(otakCompleted, sameCompleted, 'Completed'),
      });
      setDonghuaData({
        ongoing: donghuaOngoingRes?.ongoing_donghua || [],
        completed: donghuaCompletedRes?.completed_donghua || [],
      });
      if (scheduleRes?.data) setScheduleData(scheduleRes);
    };

    const fetchKomik = async () => {
      setKomikLoading(true);
      try {
        const [latestRes, populerRes] = await Promise.all([
          comicAPI.getComicTerbaru(1).catch(() => ({ comics: [] })),
          comicAPI.getComicPopuler().catch(() => ({ comics: [] })),
        ]);
        if (!cancelled) {
          setKomikData({
            latest: latestRes.comics || [],
            populer: populerRes.comics || [],
          });
        }
      } catch {
        // Silently fail — komik is bonus content
      } finally {
        if (!cancelled) setKomikLoading(false);
      }
    };

    fetchCritical();

    // Non-critical: Trakteer donors
    const idleId = requestIdleCallback(
      () => {
        fetch('/api/trakteer?action=supports&limit=10&page=1')
          .then((r) => r.json())
          .then((d) => { if (d?.result?.data) setTopDonors(d.result.data); })
          .catch(() => {});
      },
      { timeout: 5000 },
    );

    // Donate popup — delayed
    const timer = setTimeout(() => { if (!cancelled) setShowDonatePopup(true); }, 4000);

    return () => {
      cancelled = true;
      cancelIdleCallback(idleId);
      clearTimeout(timer);
    };
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
  const komikLatest = komikData?.latest || [];
  const komikPopuler = komikData?.populer || [];
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

      {/* ── Hero ── */}
      <header className="page-header home-hero home-hero--streaming">
        <div className="home-hero-copy">
          <div className="home-hero-eyebrow">✨ Gratis · Tanpa Login · Multi-Provider</div>
          <h1 className="main-title text-gradient" data-text="MRFUNK">MRFUNK</h1>
          <p className="subtitle">Nonton anime, donghua, &amp; baca komik sub Indo. Semua gratis.</p>
          <div className="home-hero-actions">
            <Link to="/search" className="btn btn-primary btn-large">🔍 Cari</Link>
            <Link to="/ongoing" className="btn btn-secondary">📺 Anime</Link>
            <Link to="/donghua-ongoing" className="btn btn-secondary">🐉 Donghua</Link>
            <Link to="/komik" className="btn btn-secondary">📖 Komik</Link>
          </div>
          <div className="home-hero-stats">
            <span className="home-stat"><strong>2</strong> Provider Anime</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Donghua ✓</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Komik ✓</span>
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
                    <div className="card-overlay"><span className="play-icon" aria-hidden="true">▶</span></div>
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

      {/* ── ANIME Section ── */}
      <section className="home-category-section">
        <div className="home-category-header">
          <h2 className="home-category-title">📺 Anime</h2>
          <div className="home-category-links">
            <Link to="/ongoing" className="home-category-link">Ongoing</Link>
            <Link to="/completed" className="home-category-link">Completed</Link>
            <Link to="/genres" className="home-category-link">Genres</Link>
            <Link to="/az-list" className="home-category-link">A-Z</Link>
          </div>
        </div>
        {ongoing.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">🔥 Sedang Tayang</h3><Link to="/ongoing" className="view-all">Semua →</Link></div>
            <div className="home-rail-scroll">{buildRailItems(ongoing, 'Ongoing')}</div>
          </div>
        )}
        {completed.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">✅ Baru Selesai</h3><Link to="/completed" className="view-all">Semua →</Link></div>
            <div className="home-rail-scroll">{buildRailItems(completed, 'Completed')}</div>
          </div>
        )}
      </section>

      {/* ── DONGHUA Section ── */}
      <section className="home-category-section">
        <div className="home-category-header">
          <h2 className="home-category-title">🐉 Donghua</h2>
          <div className="home-category-links">
            <Link to="/donghua-ongoing" className="home-category-link">Ongoing</Link>
            <Link to="/donghua-completed" className="home-category-link">Completed</Link>
            <Link to="/donghua-genres" className="home-category-link">Genres</Link>
            <Link to="/donghua-az" className="home-category-link">A-Z</Link>
          </div>
        </div>
        {donghuaOngoing.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">🔥 Sedang Tayang</h3><Link to="/donghua-ongoing" className="view-all">Semua →</Link></div>
            <div className="home-rail-scroll">{buildRailItems(donghuaOngoing, 'Ongoing', true)}</div>
          </div>
        )}
        {donghuaCompleted.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">✅ Baru Selesai</h3><Link to="/donghua-completed" className="view-all">Semua →</Link></div>
            <div className="home-rail-scroll">{buildRailItems(donghuaCompleted, 'Completed', true)}</div>
          </div>
        )}
        {!donghuaOngoing.length && !donghuaCompleted.length && (
          <p className="home-rail-empty">Memuat donghua...</p>
        )}
      </section>

      {/* ── KOMIK Section ── */}
      <section className="home-category-section">
        <div className="home-category-header">
          <h2 className="home-category-title">📖 Komik</h2>
          <div className="home-category-links">
            <Link to="/komik" className="home-category-link">Terbaru</Link>
            <Link to="/komik/genres" className="home-category-link">Genres</Link>
            <Link to="/komik/berwarna" className="home-category-link">Berwarna</Link>
            <Link to="/komik/type/manga" className="home-category-link">Manga</Link>
            <Link to="/komik/type/manhwa" className="home-category-link">Manhwa</Link>
            <Link to="/komik/type/manhua" className="home-category-link">Manhua</Link>
          </div>
        </div>
        {komikLoading ? (
          <div className="home-rail"><p className="home-rail-empty">Memuat komik...</p></div>
        ) : (
          <>
            {komikPopuler.length > 0 && (
              <div className="home-rail">
                <div className="section-header home-rail-header"><h3 className="home-rail-title">🔥 Populer</h3><Link to="/komik" className="view-all">Semua →</Link></div>
                <div className="home-rail-scroll">
                  {komikPopuler.slice(0, 12).map((comic, idx) => (
                    <div className="home-rail-card" key={comic.slug ?? idx}>
                      <HomeKomikCard comic={comic} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {komikLatest.length > 0 && (
              <div className="home-rail">
                <div className="section-header home-rail-header"><h3 className="home-rail-title">🆕 Terbaru</h3><Link to="/komik" className="view-all">Semua →</Link></div>
                <div className="home-rail-scroll">
                  {komikLatest.slice(0, 12).map((comic, idx) => (
                    <div className="home-rail-card" key={comic.slug ?? idx}>
                      <HomeKomikCard comic={comic} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!komikData && !komikLoading && (
              <p className="home-rail-empty">Komik akan dimuat setelah konten utama selesai.</p>
            )}
          </>
        )}
      </section>

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

      {/* Top Donatur */}
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
