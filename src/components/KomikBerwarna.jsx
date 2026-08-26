import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { comicAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import Icon from './Icon';
import './KomikBerwarna.css';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikBerwarna]', ...args); };

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

const BerwarnaCard = ({ comic }) => {
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

const KomikBerwarna = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (p, append = false) => {
    const isFirst = p === 1;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await comicAPI.getComicBerwarna(p);
      setComics((prev) => append ? [...prev, ...res.comics] : res.comics);
      setHasMore(res.hasMore);
      setPage(p);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        devWarn('Berwarna error:', err);
        setError(err?.message ?? 'Gagal memuat komik berwarna');
      }
    } finally {
      if (isFirst) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const prevPage = () => { if (page > 1) fetchPage(page - 1); };
  const nextPage = () => { if (hasMore) fetchPage(page + 1); };

  if (error && !loading) {
    return (
      <div className="main-container">
        <ErrorPage title="Komik Berwarna" message={error} hint="Coba lagi nanti." onRetry={() => fetchPage(1)} />
      </div>
    );
  }

  return (
    <div className="kb-page main-container">
      <header className="page-header kb-hero">
        <div className="kb-hero-copy">
          <h1 className="main-title">Komik Berwarna</h1>
          <p className="subtitle">Koleksi komik full-color — manga, manhwa, dan manhua berwarna</p>
        </div>
      </header>

      {loading ? (
        <div role="status">
          <SkeletonGrid />
          <span className="visually-hidden">Memuat komik berwarna...</span>
        </div>
      ) : (
        <>
          <div className="anime-grid">
            {comics.map((comic, idx) => (
              <BerwarnaCard key={comic.slug ?? idx} comic={comic} index={idx} />
            ))}
          </div>

          <div className="pagination kb-pagination">
            <button type="button" className="btn btn-secondary" onClick={prevPage} disabled={page <= 1}>
              <Icon name="chevron-left" size={16} /> Sebelumnya
            </button>
            <span className="page-info kb-pagination__info">Halaman {page}</span>
            <button type="button" className="btn btn-secondary" onClick={nextPage} disabled={!hasMore || loadingMore}>
              {loadingMore ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden="true" />
                  Memuat...
                </>
              ) : <>Selanjutnya <Icon name="chevron-right" size={16} /></>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default KomikBerwarna;
