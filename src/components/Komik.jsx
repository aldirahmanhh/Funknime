import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { comicAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import './Komik.css';

// Dev-only logger
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[Komik]', ...args); };

// Route comic images through the serverless img-proxy to bypass hotlink
// protection. In prod, Vercel's Referrer-Policy header overrides the HTML
// attribute, so we need the server-side proxy. In dev, no such header exists,
// so referrerPolicy="no-referrer" on <img> works directly.
const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};

// Inline SVG placeholder — no external dependency
const placeholderImg = (text) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">` +
    `<rect width="200" height="280" fill="#1a1a26"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#9333EA" font-family="sans-serif" font-size="14" font-weight="bold">` +
    (text || 'Komik').substring(0, 16) +
    `</text></svg>`
  )}`;

const KomikCard = ({ comic }) => {
  const { slug, title, poster, chapter, type, rating } = comic;
  const posterUrl = poster
    ? proxyImage(poster)
    : placeholderImg(title);

  return (
    <Link to={`/komik/${slug}`} className="anime-card card komik-card" title={title}>
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
          onError={(e) => {
            const fallback = placeholderImg(title);
            if (e.target.src !== fallback) e.target.src = fallback;
          }}
        />
        <div className="card-overlay"><span className="play-icon" aria-hidden>📖</span></div>
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

const Komik = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [latest, setLatest] = useState([]);
  const [populer, setPopuler] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [rekomendasi, setRekomendasi] = useState([]);
  const [topComics, setTopComics] = useState([]);

  // Initial load: latest + populer in parallel
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [latestRes, populerRes, rekomRes, topRes] = await Promise.all([
          comicAPI.getComicTerbaru(1, { signal: ctrl.signal }),
          comicAPI.getComicPopuler({ signal: ctrl.signal }).catch((e) => {
            devWarn('Populer fetch failed:', e?.message);
            return { comics: [] };
          }),
          comicAPI.getComicRecommendations({ signal: ctrl.signal }).catch((e) => {
            devWarn('Rekom fetch failed:', e?.message);
            return { comics: [] };
          }),
          comicAPI.getComicTop({ signal: ctrl.signal }).catch((e) => {
            devWarn('Top fetch failed:', e?.message);
            return { comics: [] };
          }),
        ]);
        if (cancelled) return;
        setLatest(latestRes.comics);
        setPopuler(populerRes.comics);
        setRekomendasi(rekomRes.comics ?? []);
        setTopComics(topRes.comics ?? []);
        setHasMore(latestRes.hasMore);
        setPage(1);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Load error:', err);
          setError(err?.message ?? 'Gagal memuat komik');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  // Search effect — debounced via setTimeout
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await comicAPI.searchComics(query, { signal: ctrl.signal });
        if (!cancelled) setSearchResults(res.comics);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Search error:', err);
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); ctrl.abort(); };
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearchParams(q ? { q } : {});
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await comicAPI.getComicTerbaru(nextPage);
      setLatest((prev) => [...prev, ...res.comics]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (err) {
      devWarn('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  if (error && !loading) {
    return (
      <div className="main-container">
        <ErrorPage
          title="Baca Komik"
          message={`Gagal memuat komik: ${error}`}
          hint="Coba lagi nanti."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const showSearch = query.trim().length > 0;

  return (
    <div className="komik-page main-container">
      <header className="page-header komik-hero">
          <div className="komik-hero-copy">
            <h1 className="main-title text-gradient">Baca Komik</h1>
            <p className="subtitle">
              {showSearch
                ? `Hasil pencarian untuk "${query}"`
                : 'Baca manga, manhwa, dan manhua favoritmu'}
            </p>
            {!showSearch && (
              <nav className="komik-quick-links" aria-label="Navigasi komik">
                <Link to="/komik/genres" className="komik-quick-link">🎯 Genre</Link>
                <Link to="/komik/berwarna" className="komik-quick-link">🎨 Berwarna</Link>
                <Link to="/komik/type/manga" className="komik-quick-link">🇯🇵 Manga</Link>
                <Link to="/komik/type/manhwa" className="komik-quick-link">🇰🇷 Manhwa</Link>
                <Link to="/komik/type/manhua" className="komik-quick-link">🇨🇳 Manhua</Link>
              </nav>
            )}
          </div>

        <form className="komik-search-form" onSubmit={handleSearch} role="search">
          <input
            type="search"
            className="komik-search-input"
            placeholder="Cari judul komik..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Cari komik"
          />
          <button type="submit" className="btn btn-primary komik-search-btn" aria-label="Cari">
            🔍 Cari
          </button>
        </form>
      </header>

      {loading ? (
        <div className="loading-container" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>Memuat komik...</p>
        </div>
      ) : showSearch ? (
        <section className="komik-section">
          <div className="section-header">
            <h2 className="section-title">Hasil Pencarian</h2>
            <span className="genres-result-count">
              {searchLoading ? '…' : `${searchResults.length} komik`}
            </span>
          </div>
          {searchLoading ? (
            <div className="loading-container"><div className="spinner" /><p>Mencari...</p></div>
          ) : searchResults.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Tidak ada komik yang cocok dengan <strong>"{query}"</strong>.</p>
            </div>
          ) : (
            <div className="anime-grid">
              {searchResults.map((comic, idx) => (
                <KomikCard key={comic.slug ?? idx} comic={comic} index={idx} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {populer.length > 0 && (
            <>
              <section className="komik-section">
                <div className="section-header">
                  <h2 className="section-title">🔥 Populer</h2>
                </div>
                <div className="anime-grid">
                  {populer.map((comic, idx) => (
                    <KomikCard key={comic.slug ?? idx} comic={comic} index={idx} />
                  ))}
                </div>
              </section>

              {topComics.length > 0 && (
                <section className="komik-section">
                  <div className="section-header">
                    <h2 className="section-title">🏆 Top Peringkat</h2>
                  </div>
                  <div className="anime-grid">
                    {topComics.slice(0, 12).map((comic, idx) => (
                      <KomikCard key={comic.slug ?? idx} comic={comic} index={idx} />
                    ))}
                  </div>
                </section>
              )}

              {rekomendasi.length > 0 && (
                <section className="komik-section">
                  <div className="section-header">
                    <h2 className="section-title">🎯 Rekomendasi</h2>
                  </div>
                  <div className="anime-grid">
                    {rekomendasi.slice(0, 12).map((comic, idx) => (
                      <KomikCard key={comic.slug ?? idx} comic={comic} index={idx} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <section className="komik-section">
            <div className="section-header">
              <h2 className="section-title">🆕 Terbaru</h2>
            </div>
            <div className="anime-grid">
              {latest.map((comic, idx) => (
                <KomikCard key={comic.slug ?? idx} comic={comic} index={idx} />
              ))}
            </div>
          </section>

          {hasMore && (
            <div className="komik-load-more">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Komik;
