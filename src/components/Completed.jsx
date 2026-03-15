import { useEffect } from 'react';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const Completed = () => {
  const fetchCompleted = async (page) => {
    const response = await animeAPI.getCompleted(page);
    return response?.data?.animeList || [];
  };

  const {
    data: animes,
    loading,
    error,
    hasMore,
    lastElementRef,
    reset
  } = useInfiniteScroll(fetchCompleted, []);

  useEffect(() => {
    return () => {
      reset();
    };
  }, []);

  if (loading && animes.length === 0) {
    return (
      <div className="anime-list-page main-container">
        <header className="page-header">
          <h1 className="main-title text-gradient">Anime Selesai</h1>
          <p className="subtitle">Anime yang sudah tamat</p>
        </header>
        <SkeletonAnimeGrid count={12} />
      </div>
    );
  }

  if (error && animes.length === 0) {
    return (
      <div className="main-container">
        <div className="error-container">
          <div className="error-icon" aria-hidden>⚠️</div>
          <p className="error-message">Gagal memuat anime selesai: {error}</p>
          <p className="error-hint">Server mungkin sedang bermasalah (mis. error 500). Coba lagi nanti.</p>
          <button type="button" className="btn btn-primary" onClick={reset}>Coba Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="anime-list-page main-container">
      <header className="page-header">
        <h1 className="main-title text-gradient">Anime Selesai</h1>
        <p className="subtitle">Anime yang sudah tamat</p>
        {error && <p className="error-message">{error}</p>}
      </header>
      <div className="anime-grid">
        {animes.map((anime, idx) => (
          <AnimeCard
            key={anime.animeId ?? anime.slug ?? idx}
            anime={anime}
            index={idx}
            innerRef={idx === animes.length - 1 ? lastElementRef : undefined}
            statusOverride="Completed"
          />
        ))}
      </div>

      {loading && hasMore && (
        <div className="loading-more">
          <div className="spinner" aria-hidden />
          <p>Memuat lebih banyak...</p>
        </div>
      )}

      {!hasMore && animes.length > 0 && (
        <div className="end-message">
          <p>Tidak ada lagi anime untuk dimuat</p>
        </div>
      )}
    </div>
  );
};

export default Completed;