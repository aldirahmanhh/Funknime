import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { comicAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import Icon from './Icon';
import './Komik.css';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[Komik]', ...args); };

const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};

const placeholderImg = (text) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">` +
    `<rect width="200" height="280" fill="#181822"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#7E7E9C" font-family="sans-serif" font-size="14" font-weight="bold">` +
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
          alt={`${title} poster`}
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
        <div className="card-overlay">
          <span className="play-icon"><Icon name="book" size={20} /></span>
        </div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {chapter && <span className="episode-count num">{chapter}</span>}
          {rating && <span className="score num"><Icon name="star" size={12} /> {rating}</span>}
        </div>
      </div>
    </Link>
  );
};

const SkeletonGrid = () => (
  <div className="anime-grid" aria-hidden="true">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="skeleton skeleton-card" />
    ))}
  </div>
);

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
            <h1 className="main-title">Baca Komik</h1>
            <p className="subtitle">
              {showSearch
                ? `Hasil pencarian untuk "${query}"`
                : 'Baca manga, manhwa, dan manhua favoritmu'}
            </p>
            {!showSearch && (
              <nav className="komik-quick-links" aria-label="Navigasi komik">
                <Link to="/komik/genres" className="komik-quick-link"><Icon name="layers" size={16} /> Genre</Link>
                <Link to="/komik/berwarna" className="komik-quick-link"><Icon name="sparkle" size={16} /> Berwarna</Link>
                <Link to="/komik/type/manga" className="komik-quick-link"><Icon name="book" size={16} /> Manga</Link>
                <Link to="/komik/type/manhwa" className="komik-quick-link"><Icon name="book" size={16} /> Manhwa</Link>
                <Link to="/komik/type/manhua" className="komik-quick-link"><Icon name="book" size={16} /> Manhua</Link>
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
            <Icon name="search" size={16} /> Cari
          </button>
        </form>
      </header>

      {loading ? (
        <div role="status" aria-live="polite">
          <SkeletonGrid />
          <span className="visually-hidden">Memuat komik...</span>
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
            <SkeletonGrid />
          ) : searchResults.length === 0 ? (
            <div className="empty-state">
              <p>Tidak ada komik yang cocok dengan <strong>&ldquo;{query}&rdquo;</strong>.</p>
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
                  <h2 className="section-title"><Icon name="flame" size={20} /> Populer</h2>
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
                    <h2 className="section-title"><Icon name="star" size={20} /> Top Peringkat</h2>
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
                    <h2 className="section-title"><Icon name="sparkle" size={20} /> Rekomendasi</h2>
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
              <h2 className="section-title">Terbaru</h2>
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
                className="btn btn-secondary btn--lg"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden="true" />
                    Memuat...
                  </>
                ) : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Komik;
