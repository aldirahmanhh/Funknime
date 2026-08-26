import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI, comicAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import AnimeCarousel from './AnimeCarousel';
import Footer from './Footer';
import { getWatchHistory, formatTime } from '../utils/watchHistory';
import { mergeAnimeLists } from '../utils/animeUtils';
import Icon from './Icon';
import './Home.css';

const DAY_ORDER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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
        <div className="card-overlay"><span className="play-icon" aria-hidden="true"><Icon name="book" size={20} /></span></div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {chapter && <span className="episode-count">{chapter}</span>}
          {rating && <span className="score"><Icon name="star" size={14} /> {rating}</span>}
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
  const [komikLoading, setKomikLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchCritical = async () => {
      try {
        const homeRes = await animeAPI.getHome();
        if (cancelled) return;

        const otakOngoing = homeRes?.data?.ongoing?.animeList || [];
        const otakCompleted = homeRes?.data?.completed?.animeList || [];

        setHomeData({ ongoing: otakOngoing, completed: otakCompleted });
        setLoading(false);

        requestIdleCallback(
          () => { if (!cancelled) fetchSecondary(otakOngoing, otakCompleted); },
          { timeout: 2000 },
        );

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
        // Silently fail
      } finally {
        if (!cancelled) setKomikLoading(false);
      }
    };

    fetchCritical();

    const idleId = requestIdleCallback(
      () => {
        fetch('/api/trakteer?action=supports&limit=10&page=1')
          .then((r) => r.json())
          .then((d) => { if (d?.result?.data) setTopDonors(d.result.data); })
          .catch(() => {});
      },
      { timeout: 5000 },
    );

    return () => {
      cancelled = true;
      cancelIdleCallback(idleId);
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
      {/* ── Hero ── */}
      <header className="page-header home-hero home-hero--streaming">
        <div className="home-hero-copy">
          <div className="home-hero-eyebrow">Gratis · Tanpa Login · Multi-Provider</div>
          <h1 className="main-title">MrFunk</h1>
          <p className="subtitle">Nonton anime, donghua, &amp; baca komik sub Indo. Semua gratis.</p>
          <div className="home-hero-actions">
            <Link to="/search" className="btn btn-primary btn-large"><Icon name="search" /> Cari</Link>
            <Link to="/ongoing" className="btn btn-secondary"><Icon name="play" /> Anime</Link>
            <Link to="/donghua-ongoing" className="btn btn-secondary"><Icon name="monitor" /> Donghua</Link>
            <Link to="/komik" className="btn btn-secondary"><Icon name="book" /> Komik</Link>
          </div>
          <div className="home-hero-stats">
            <span className="home-stat"><strong>2</strong> Provider Anime</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Donghua</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Komik</span>
            <span className="home-stat-sep">·</span>
            <span className="home-stat">Resume otomatis</span>
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
            <h2 className="section-title">Lanjut Tonton</h2>
            <Link to="/history" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link>
          </div>
          <div className="home-rail-scroll">
            {watchHistory.slice(0, 12).map((item, idx) => (
              <div className="home-rail-card" key={`${item.animeId}-${item.episodeId}-${idx}`}>
                <Link to={`/watch/${item.episodeId}`} state={{ provider: item.provider, backAnimeId: item.animeId }} className="anime-card card">
                  <div className="card-image-wrapper">
                    <span className="anime-card-badge anime-card-badge--ongoing">Lanjut</span>
                    {item.poster ? <img src={item.poster} alt={item.animeTitle} className="poster" loading="lazy" decoding="async" /> : <div className="home-watch-placeholder"><Icon name="play" size={24} /></div>}
                    <div className="card-overlay"><span className="play-icon" aria-hidden="true"><Icon name="play" size={20} /></span></div>
                    {item.currentTime > 0 && item.duration > 0 && (
                      <div className="home-progress-track">
                        <div className="home-progress-fill" style={{ width: `${Math.min((item.currentTime / item.duration) * 100, 100)}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="anime-info">
                    <h3>{item.animeTitle}</h3>
                    <div className="meta"><span className="episode-count">{item.episodeTitle || 'Episode'}</span></div>
                    {item.currentTime > 0 && <div className="home-watch-time"><Icon name="clock" size={11} /> <span className="num">{formatTime(item.currentTime)}</span></div>}
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
          <h2 className="home-category-title">Anime</h2>
          <div className="home-category-links">
            <Link to="/ongoing" className="home-category-link">Ongoing</Link>
            <Link to="/completed" className="home-category-link">Completed</Link>
            <Link to="/genres" className="home-category-link">Genres</Link>
            <Link to="/az-list" className="home-category-link">A-Z</Link>
          </div>
        </div>
        {ongoing.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">Sedang tayang</h3><Link to="/ongoing" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link></div>
            <div className="home-rail-scroll">{buildRailItems(ongoing, 'Ongoing')}</div>
          </div>
        )}
        {completed.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">Baru selesai</h3><Link to="/completed" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link></div>
            <div className="home-rail-scroll">{buildRailItems(completed, 'Completed')}</div>
          </div>
        )}
      </section>

      {/* ── DONGHUA Section ── */}
      <section className="home-category-section">
        <div className="home-category-header">
          <h2 className="home-category-title">Donghua</h2>
          <div className="home-category-links">
            <Link to="/donghua-ongoing" className="home-category-link">Ongoing</Link>
            <Link to="/donghua-completed" className="home-category-link">Completed</Link>
            <Link to="/donghua-genres" className="home-category-link">Genres</Link>
            <Link to="/donghua-az" className="home-category-link">A-Z</Link>
          </div>
        </div>
        {donghuaOngoing.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">Sedang tayang</h3><Link to="/donghua-ongoing" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link></div>
            <div className="home-rail-scroll">{buildRailItems(donghuaOngoing, 'Ongoing', true)}</div>
          </div>
        )}
        {donghuaCompleted.length > 0 && (
          <div className="home-rail">
            <div className="section-header home-rail-header"><h3 className="home-rail-title">Baru selesai</h3><Link to="/donghua-completed" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link></div>
            <div className="home-rail-scroll">{buildRailItems(donghuaCompleted, 'Completed', true)}</div>
          </div>
        )}
        {!donghuaOngoing.length && !donghuaCompleted.length && (
          <p className="home-rail-empty">Memuat donghua…</p>
        )}
      </section>

      {/* ── KOMIK Section ── */}
      <section className="home-category-section">
        <div className="home-category-header">
          <h2 className="home-category-title">Komik</h2>
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
          <div className="home-rail"><p className="home-rail-empty">Memuat komik…</p></div>
        ) : (
          <>
            {komikPopuler.length > 0 && (
              <div className="home-rail">
                <div className="section-header home-rail-header"><h3 className="home-rail-title">Populer</h3><Link to="/komik" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link></div>
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
                <div className="section-header home-rail-header"><h3 className="home-rail-title">Terbaru</h3><Link to="/komik" className="view-all">Lihat semua <Icon name="arrow-right" size={14} /></Link></div>
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
          <div className="section-header"><h2 className="section-title">Jadwal tayang</h2><Link to="/schedule" className="view-all">Buka jadwal <Icon name="arrow-right" size={14} /></Link></div>
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
            <h2 className="section-title">Top Donatur</h2>
            <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="view-all">Donasi juga <Icon name="arrow-right" size={14} /></a>
          </div>
          <div className="donor-list">
            {topDonors.slice(0, 5).map((donor, idx) => {
              const rankClass = idx === 0 ? 'donor-rank--gold' : idx === 1 ? 'donor-rank--silver' : idx === 2 ? 'donor-rank--bronze' : '';
              return (
                <div key={donor.order_id || idx} className="donor-row">
                  <span className={`donor-rank num ${rankClass}`} aria-label={`Peringkat ${idx + 1}`}>{idx + 1}</span>
                  <div className="donor-info">
                    <div className="donor-name">{donor.creator_name || 'Anonim'}</div>
                    {donor.support_message && <div className="donor-message">&ldquo;{donor.support_message}&rdquo;</div>}
                  </div>
                  <div className="donor-amount">
                    <div className="donor-quantity">{donor.quantity}× {donor.unit_name}</div>
                    <div className="donor-rupiah">Rp {(donor.amount || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              );
            })}
            <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="donor-cta-row">
              <span><Icon name="heart" size={16} /> Trakteer MrFunk</span>
              <span className="donor-cta-arrow">→</span>
            </a>
          </div>
        </section>
      )}

      {/* Donate band — inline, replaces timed popup */}
      <section className="home-donate-band" aria-label="Dukung MrFunk">
        <div className="home-donate-band-inner">
          <Icon name="heart" size={28} className="home-donate-band-icon" />
          <h2 className="home-donate-band-title">Dukung MrFunk</h2>
          <p className="home-donate-band-text">Gratis selamanya — dukungan kamu membantu biaya server.</p>
          <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-large">
            Trakteer Sekarang
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
