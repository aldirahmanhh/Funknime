import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { comicAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import './KomikGenres.css';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikGenres]', ...args); };

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

const GenreComicCard = ({ comic }) => {
  const { slug, title, poster, rating, type } = comic;
  const posterUrl = poster ? proxyImage(poster) : placeholderImg(title);
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
          onError={(e) => { const f = placeholderImg(title); if (e.target.src !== f) e.target.src = f; }}
        />
        <div className="card-overlay"><span className="play-icon" aria-hidden>📖</span></div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {rating && <span className="score">⭐ {rating}</span>}
        </div>
      </div>
    </Link>
  );
};

const KomikGenres = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') ?? '';

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [comics, setComics] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load genres on mount
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await comicAPI.getComicGenres({ signal: ctrl.signal });
        if (!cancelled) setGenres(res);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Genres error:', err);
          setError(err?.message ?? 'Gagal memuat genre');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  // Load comics by genre when selected
  useEffect(() => {
    if (!selectedGenre) { setComics([]); return; }
    let cancelled = false;
    const ctrl = new AbortController();
    setGenreLoading(true);
    setPage(1);
    setComics([]);
    setSearchParams({ genre: selectedGenre }, { replace: true });

    (async () => {
      try {
        const res = await comicAPI.getComicByGenre(selectedGenre, 1, { signal: ctrl.signal });
        if (!cancelled) {
          setComics(res.comics);
          setHasMore(res.hasMore);
          setPage(1);
        }
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Genre load error:', err);
        }
      } finally {
        if (!cancelled) setGenreLoading(false);
      }
    })();
    return () => { cancelled = true; ctrl.abort(); };
  }, [selectedGenre]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !selectedGenre) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await comicAPI.getComicByGenre(selectedGenre, nextPage);
      setComics((prev) => [...prev, ...res.comics]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (err) {
      devWarn('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, selectedGenre]);

  const selectedGenreTitle = genres.find((g) => g.slug === selectedGenre)?.title ?? selectedGenre;

  if (error && !loading) {
    return (
      <div className="main-container">
        <ErrorPage title="Genre Komik" message={`Gagal memuat genre: ${error}`} hint="Coba lagi nanti." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="kg-page main-container">
      <header className="page-header kg-hero">
        <div className="kg-hero-copy">
          <h1 className="main-title text-gradient">Genre Komik</h1>
          <p className="subtitle">
            {genres.length > 0
              ? `${genres.length} genre tersedia`
              : 'Temukan komik berdasarkan genre'}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="loading-container" role="status"><div className="spinner" /><p>Memuat genre...</p></div>
      ) : (
        <>
          <div className="kg-genre-grid">
            {genres.map((genre) => {
              const isActive = selectedGenre === genre.slug;
              return (
                <button
                  key={genre.slug}
                  type="button"
                  className={`kg-genre-btn${isActive ? ' kg-genre-btn--active' : ''}`}
                  onClick={() => setSelectedGenre(isActive ? '' : genre.slug)}
                  aria-pressed={isActive}
                >
                  {genre.title}
                </button>
              );
            })}
          </div>

          {selectedGenre ? (
            <section className="kg-result-section">
              <div className="section-header">
                <div className="genres-result-title-group">
                  <h2 className="section-title">{selectedGenreTitle}</h2>
                  <span className="genres-result-count">
                    {genreLoading ? '…' : `${comics.length} komik`}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setSelectedGenre(''); setComics([]); setSearchParams({}, { replace: true }); }}
                >
                  ✕ Hapus
                </button>
              </div>

              {genreLoading ? (
                <div className="loading-container"><div className="spinner" /><p>Memuat komik...</p></div>
              ) : comics.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Tidak ada komik di genre <strong>{selectedGenreTitle}</strong>.</p>
                </div>
              ) : (
                <>
                  <div className="anime-grid">
                    {comics.map((comic, idx) => (
                      <GenreComicCard key={comic.slug ?? idx} comic={comic} index={idx} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="komik-load-more">
                      <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          ) : (
            <p className="kg-hint" style={{ textAlign: 'center', color: 'var(--color-text-muted, #888)', padding: '2rem 0' }}>
              Pilih genre di atas untuk melihat komik.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default KomikGenres;
