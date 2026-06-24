import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { comicAPI } from '../services/api';
import { logError } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import './Komik.css';

/**
 * Route komiku.org image URLs through the server-side proxy to bypass
 * hotlink protection (Vercel's global Referrer-Policy header overrides
 * the HTML referrerPolicy attribute).
 */
const KOMIKU_HOSTS = ['img.komiku.org', 'thumbnail.komiku.org', 'komiku.org'];
const proxyImg = (url) => {
  if (!url) return url;
  if (isDev) return url;
  try {
    const { hostname } = new URL(url);
    if (KOMIKU_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
      return `/api/img-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // not a valid URL — return as-is
  }
  return url;
};

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devLog = (...args) => { if (isDev) console.log(...args); };

const PAGE_SIZE_HINT = 20;

const TABS = [
  { key: 'terbaru', label: '🕐 Terbaru' },
  { key: 'populer', label: '🔥 Populer' },
];

// Normalize type label for the badge
const TYPE_SHORT = { manga: 'Manga', manhwa: 'Manhwa', manhua: 'Manhua', comic: 'Komik' };
const normalizeType = (type) => {
  if (!type) return null;
  return TYPE_SHORT[type.toLowerCase()] ?? type;
};

const ComicCard = ({ item }) => {
  const cover = proxyImg(item.poster || item.image);
  const typeLabel = normalizeType(item.type);

  return (
    <Link
      to={`/komik/${item.slug}`}
      className="komik-card"
      title={item.title}
      aria-label={`${item.title}${item.chapter ? ` — ${item.chapter}` : ''}`}
    >
      <div className="komik-card__cover-wrap">
        {typeLabel && (
          <span className="komik-card__type-badge" aria-hidden="true">
            {typeLabel}
          </span>
        )}
        <img
          src={cover}
          alt=""
          className="komik-card__cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = 'https://placehold.co/200x280/16161F/9333EA?text=No+Cover';
          }}
        />
        <div className="komik-card__overlay" aria-hidden="true">
          <span className="komik-card__read-icon">📖 Baca</span>
        </div>
      </div>
      <div className="komik-card__info">
        <h3 className="komik-card__title">{item.title}</h3>
        <div className="komik-card__meta">
          {item.chapter && (
            <span className="komik-card__chapter">{item.chapter}</span>
          )}
          {item.time_ago && (
            <span className="komik-card__time">{item.time_ago}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

const Komik = () => {
  const [tab, setTab] = useState('terbaru');
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchComics = useCallback(async (activeTab, activePage, signal) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (activeTab === 'terbaru') {
        result = await comicAPI.getComicTerbaru(activePage, { signal });
      } else {
        // Populer is single-page aggregate; only show on page 1
        result = await comicAPI.getComicPopuler({ signal });
      }
      if (signal?.aborted) return;
      const list = result?.komikList ?? [];
      setComics(list);
      setHasMore(activeTab === 'terbaru'
        ? (result?.hasMore ?? list.length >= PAGE_SIZE_HINT)
        : false);
      devLog('[Komik] fetched', activeTab, activePage, list.length);
      if (!list.length && activeTab !== 'terbaru') {
        logInfo('[Komik] Populer returned empty array - check API response');
      }
    } catch (err) {
      if (signal?.aborted) return;
      logError('[Komik] Fetch error:', err);
      setError(err?.message ?? 'Gagal memuat komik');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    const controller = new AbortController();
    fetchComics(tab, 1, controller.signal);
    return () => controller.abort();
  }, [tab, fetchComics]);

  useEffect(() => {
    if (page === 1) return;
    const controller = new AbortController();
    fetchComics(tab, page, controller.signal);
    return () => controller.abort();
  }, [page, tab, fetchComics]);

  const handleTabChange = (next) => {
    if (next === tab) return;
    setComics([]);
    setTab(next);
  };

  const handleRetry = () => fetchComics(tab, page);

  return (
    <div className="komik-page main-container">

      {/* ── Page Header ── */}
      <header className="komik-page__header page-header">
        <div className="komik-page__header-text">
          <h1 className="main-title komik-page__title">
            <span className="komik-page__title-icon" aria-hidden="true">📚</span>
            Komik
          </h1>
          <p className="subtitle komik-page__subtitle">
            Manga · Manhwa · Manhua
            {comics.length > 0 && !loading && (
              <span className="komik-page__count" aria-live="polite">
                {' '}— {comics.length} judul
              </span>
            )}
          </p>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div className="komik-tabs" role="tablist" aria-label="Filter komik">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`komik-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="komik-panel"
            className={`komik-tab${tab === t.key ? ' komik-tab--active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content Panel ── */}
      <div
        id="komik-panel"
        role="tabpanel"
        aria-labelledby={`komik-tab-${tab}`}
        className="komik-panel"
      >
        {loading && comics.length === 0 ? (
          <SkeletonAnimeGrid count={12} />
        ) : error && comics.length === 0 ? (
          <div className="error-container">
            <div className="error-icon" aria-hidden="true">😵</div>
            <h2>Gagal Memuat Komik</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button type="button" className="btn btn-primary" onClick={handleRetry}>
                🔄 Coba Lagi
              </button>
              <Link to="/" className="btn btn-secondary">← Beranda</Link>
            </div>
          </div>
        ) : comics.length === 0 ? (
          <div className="empty-state">
            <p>Tidak ada komik saat ini.</p>
            <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
          </div>
        ) : (
          <>
            <div className="komik-grid" aria-label={`${tab === 'terbaru' ? 'Komik terbaru' : 'Komik populer'}`}>
              {comics.map((item, idx) => (
                <ComicCard key={item.slug || idx} item={item} />
              ))}
            </div>

            {/* Inline loading overlay for page changes */}
            {loading && comics.length > 0 && (
              <div className="komik-loading-more" role="status" aria-live="polite">
                <div className="spinner" aria-hidden="true" />
                <span>Memuat…</span>
              </div>
            )}

            {/* Pagination — only for terbaru */}
            {tab === 'terbaru' && (
              <nav className="pagination komik-pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  aria-label="Halaman sebelumnya"
                >
                  ← Prev
                </button>
                <span className="page-info">Hal. {page}</span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore || loading}
                  aria-disabled={!hasMore || loading}
                  aria-label="Halaman berikutnya"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Komik;
