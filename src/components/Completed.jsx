import { useEffect } from 'react';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { mergeAnimeLists } from '../utils/animeUtils';

const fetchCompletedData = async (page) => {
  const [otakRes, sameRes] = await Promise.all([
    animeAPI.getCompleted(page).catch(() => ({ data: { animeList: [] } })),
    animeAPI.getCompletedSamehadaku().catch(() => ({ data: { animeList: [] } })),
  ]);

  const otakList = otakRes?.data?.animeList || [];
  const sameList = sameRes?.data?.animeList || [];

  return mergeAnimeLists(otakList, sameList);
};

const Completed = () => {
  const fetchCompleted = async (page) => {
    const merged = await fetchCompletedData(page);
    return merged;
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
        <header className="page-header section section-neo">
          <h1 className="main-title text-gradient">Anime Selesai</h1>
          <p className="subtitle">Kumpulan anime yang sudah tamat dari Otakudesu & Samehadaku.</p>
        </header>
        <section className="section section-neo">
          <SkeletonAnimeGrid count={12} />
        </section>
      </div>
    );
  }

  if (error && animes.length === 0) {
    return (
      <div className="anime-list-page main-container">
        <section className="section section-neo">
          <div className="error-container">
            <div className="error-icon" aria-hidden>⚠️</div>
            <p className="error-message">Gagal memuat anime selesai: {error}</p>
            <p className="error-hint">Server mungkin sedang bermasalah (mis. error 500). Coba lagi nanti.</p>
            <button type="button" className="btn btn-primary" onClick={reset}>Coba Lagi</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="anime-list-page main-container">
      <header className="page-header section section-neo">
        <h1 className="main-title text-gradient">Anime Selesai</h1>
        <p className="subtitle">Anime yang sudah tamat dari Otakudesu & Samehadaku.</p>
        {error && <p className="error-message">{error}</p>}
      </header>

      <section className="section section-neo">
        <div className="anime-grid">
          {animes.map((anime, idx) => {
            const providers = anime.providers || [anime.provider];
            const hasOtak = providers.includes('otakudesu');
            const hasSame = providers.includes('samehadaku');
            const providerHint = hasOtak && hasSame ? 'Otakudesu & Samehadaku' : (hasSame ? 'Samehadaku' : 'Otakudesu');
            
            return (
              <AnimeCard
                key={anime.animeId ?? anime.slug ?? idx}
                anime={{ ...anime, provider: anime.provider ?? 'otakudesu' }}
                index={idx}
                innerRef={idx === animes.length - 1 ? lastElementRef : undefined}
                statusOverride="Completed"
                providerHint={providerHint}
              />
            );
          })}
        </div>
      </section>

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