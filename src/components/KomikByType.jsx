import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { comicAPI } from '../services/api';
import ErrorPage from './ErrorPage';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikByType]', ...args); };

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

const TypeEmoji = { manga: '🇯🇵', manhwa: '🇰🇷', manhua: '🇨🇳' };
const TypeLabel = { manga: 'Manga (Jepang)', manhwa: 'Manhwa (Korea)', manhua: 'Manhua (China)' };

const TypeCard = ({ comic }) => {
  const { slug, title, poster, chapter, type, rating } = comic;
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
          {chapter && <span className="episode-count">{chapter}</span>}
          {rating && <span className="score">⭐ {rating}</span>}
        </div>
      </div>
    </Link>
  );
};

const KomikByType = () => {
  const { type } = useParams();
  const validType = TypeLabel[type] ? type : null;
  const label = validType ? TypeLabel[type] : 'Tipe Tidak Dikenal';
  const emoji = validType ? (TypeEmoji[type] || '') : '';

  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (p, append = false) => {
    if (!validType) return;
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await comicAPI.getComicByType(validType, p);
      setComics((prev) => append ? [...prev, ...res.comics] : res.comics);
      setHasMore(res.hasMore);
      setPage(p);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        devWarn('ByType error:', err);
        setError(err?.message ?? 'Gagal memuat komik');
      }
    } finally {
      if (p === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [validType]);

  useEffect(() => {
    if (!validType) { setLoading(false); setError('Tipe tidak valid'); return; }
    setError(null);
    fetchPage(1);
    window.scrollTo(0, 0);
  }, [validType]);

  const loadMore = () => { if (!loadingMore && hasMore) fetchPage(page + 1, true); };

  if (!validType && !loading) {
    return (
      <div className="main-container">
        <ErrorPage title="Tipe Komik" message="Tipe komik tidak dikenal. Gunakan manga, manhwa, atau manhua." hint="" />
      </div>
    );
  }

  return (
    <div className="kbt-page main-container">
      <header className="page-header kbt-hero">
        <div className="kbt-hero-copy">
          <h1 className="main-title text-gradient">{emoji} {label}</h1>
          <p className="subtitle">Daftar komik terbaru tipe {validType}</p>
          <nav className="kbt-tabs" aria-label="Filter tipe">
            {Object.entries(TypeLabel).map(([t, lbl]) => (
              <Link
                key={t}
                to={`/komik/type/${t}`}
                className={`kbt-tab${t === type ? ' kbt-tab--active' : ''}`}
                aria-current={t === type ? 'page' : undefined}
              >
                {TypeEmoji[t]} {lbl}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {loading ? (
        <div className="loading-container" role="status"><div className="spinner" /><p>Memuat komik {validType}...</p></div>
      ) : error ? (
        <ErrorPage title={label} message={error} hint="Coba lagi nanti." onRetry={() => fetchPage(1)} />
      ) : (
        <>
          {comics.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Tidak ada komik untuk tipe <strong>{validType}</strong>.</p>
            </div>
          ) : (
            <>
              <div className="anime-grid">
                {comics.map((comic, idx) => (
                  <TypeCard key={comic.slug ?? idx} comic={comic} index={idx} />
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
        </>
      )}
    </div>
  );
};

export default KomikByType;
