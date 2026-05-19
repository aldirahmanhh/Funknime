import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import AnimeCard from './AnimeCard';
import { SkeletonAnimeGrid } from './Skeleton';

const PAGE_SIZE_HINT = 24;

const DonghuaCompleted = () => {
  const [donghua, setDonghua] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const fetchDonghua = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await animeAPI.getDonghuaCompleted(page);
        if (cancelled) return;
        const donghuaList = response?.completed_donghua || [];
        setDonghua(Array.isArray(donghuaList) ? donghuaList : []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message ?? 'Gagal memuat donghua completed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDonghua();
    return () => { cancelled = true; };
  }, [page]);

  // The API doesn't expose total pages, so we infer "has more" from page size.
  // If the current page returns fewer items than the typical full page, assume end.
  const hasMore = donghua.length >= PAGE_SIZE_HINT;

  if (loading && donghua.length === 0) {
    return (
      <div className="main-container">
        <header className="page-header">
          <h1 className="main-title">Donghua Completed</h1>
          <p className="subtitle">Donghua yang sudah tamat</p>
        </header>
        <SkeletonAnimeGrid count={12} />
      </div>
    );
  }

  if (error && donghua.length === 0) {
    return (
      <div className="error-container main-container">
        <p className="error-message">Gagal memuat donghua: {error}</p>
        <button type="button" className="btn btn-primary" onClick={() => setPage(1)}>
          Coba Lagi
        </button>
        <Link to="/" className="btn btn-secondary">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="main-title">Donghua Completed</h1>
        <p className="subtitle">Donghua yang sudah tamat - {donghua.length} judul</p>
      </header>

      {donghua.length === 0 ? (
        <div className="empty-state">
          <p>Tidak ada donghua completed saat ini</p>
          <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
        </div>
      ) : (
        <div className="anime-grid">
          {donghua.map((item, idx) => (
            <AnimeCard
              key={item.slug || item.href || idx}
              anime={{
                ...item,
                animeId: item.slug || item.href,
                title: item.title,
                poster: item.poster,
                episodes: item.episodes,
                status: 'Completed',
                type: 'Donghua',
                provider: 'donghua',
              }}
              index={idx}
              statusOverride="Completed"
              providerHint="Donghua"
            />
          ))}
        </div>
      )}

      {/* Pagination */}
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

export default DonghuaCompleted;
