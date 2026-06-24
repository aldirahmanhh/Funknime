import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { comicAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';

const PAGE_SIZE_HINT = 20;

const KomikGenreFilter = () => {
  const { slug } = useParams();
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetch = useCallback(async (genre, p) => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      const result = await comicAPI.getComicByGenre(genre, p);
      if (cancelled) return;
      const list = result?.comics ?? [];
      setComics(list);
      setHasMore(result?.hasMore ?? list.length >= PAGE_SIZE_HINT);
    } catch (err) {
      if (!cancelled) setError(err?.message ?? 'Gagal memuat komik');
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setPage(1);
    const cancel = fetch(slug, 1);
    return cancel;
  }, [slug, fetch]);

  useEffect(() => {
    if (page === 1) return;
    const cancel = fetch(slug, page);
    return cancel;
  }, [page, slug, fetch]);

  if (loading && comics.length === 0) {
    return (
      <div className="main-container">
        <header className="page-header">
          <h1 className="main-title">Genre: {slug}</h1>
        </header>
        <SkeletonAnimeGrid count={12} />
      </div>
    );
  }

  if (error && comics.length === 0) {
    return (
      <div className="error-container main-container">
        <p className="error-message">Gagal memuat komik: {error}</p>
        <button type="button" className="btn btn-primary" onClick={() => fetch(slug, page)}>
          Coba Lagi
        </button>
        <Link to="/komik" className="btn btn-secondary">Daftar Komik</Link>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="main-title">Genre: {slug}</h1>
        <p className="subtitle">{comics.length} judul</p>
      </header>

      {comics.length === 0 ? (
        <div className="empty-state">
          <p>Tidak ada komik untuk genre ini</p>
          <Link to="/komik" className="btn btn-primary">Daftar Komik</Link>
        </div>
      ) : (
        <div className="anime-grid komik-grid">
          {comics.map((item, idx) => (
            <Link
              key={item.slug || idx}
              to={`/komik/${item.slug}`}
              className="anime-card card komik-card"
              title={item.title}
            >
              <div className="card-image-wrapper">
                {item.type && (
                  <span className="anime-card-badge anime-card-badge--ongoing komik-type-badge">
                    {item.type}
                  </span>
                )}
                <img
                  src={item.poster || item.image}
                  alt={item.title}
                  className="poster"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/200x280/16161F/9333EA?text=No+Cover';
                  }}
                />
                <div className="card-overlay">
                  <span className="play-icon" aria-hidden>📖</span>
                </div>
              </div>
              <div className="anime-info">
                <h3>{item.title}</h3>
                <div className="meta">
                  {item.chapter && <span className="episode-count">{item.chapter}</span>}
                  {item.time_ago && <span className="release-day">{item.time_ago}</span>}
                </div>
                <span className="card-provider-tag">Komik</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="pagination">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          ← Previous
        </button>
        <span className="page-info">Page {page}</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || loading}
          aria-disabled={!hasMore || loading}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default KomikGenreFilter;
