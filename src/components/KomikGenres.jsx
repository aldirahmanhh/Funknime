import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { comicAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import Icon from './Icon';
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
    `<rect width="200" height="280" fill="#181822"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#7E7E9C" font-family="sans-serif" font-size="14" font-weight="bold">` +
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
          alt={`${title} poster`}
          className="poster"
          loading="lazy"
          decoding="async"
          width={200}
          height={280}
          referrerPolicy="no-referrer"
          onError={(e) => { const f = placeholderImg(title); if (e.target.src !== f) e.target.src = f; }}
        />
        <div className="card-overlay">
          <span className="play-icon"><Icon name="book" size={20} /></span>
        </div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
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
    // Refetch only when the selected genre changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h1 className="main-title">Genre Komik</h1>
          <p className="subtitle">
            {genres.length > 0
              ? `${genres.length} genre tersedia`
              : 'Temukan komik berdasarkan genre'}
          </p>
        </div>
      </header>

      {loading ? (
        <div role="status">
          <SkeletonGrid />
          <span className="visually-hidden">Memuat genre...</span>
        </div>
      ) : (
        <>
          <div className="kg-genre-grid">
            {genres.map((genre) => {
              const isActive = selectedGenre === genre.slug;
              return (
                <button
                  key={genre.slug}
                  type="button"
                  className={`filter-tab kg-genre-btn${isActive ? ' active' : ''}`}
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
                  className="btn btn-ghost btn--sm"
                  onClick={() => { setSelectedGenre(''); setComics([]); setSearchParams({}, { replace: true }); }}
                >
                  <Icon name="close" size={14} /> Hapus
                </button>
              </div>

              {genreLoading ? (
                <SkeletonGrid />
              ) : comics.length === 0 ? (
                <div className="empty-state">
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
                      <button type="button" className="btn btn-secondary btn--lg" onClick={loadMore} disabled={loadingMore}>
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
            </section>
          ) : (
            <p className="kg-hint empty-state">
              Pilih genre di atas untuk melihat komik.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default KomikGenres;
