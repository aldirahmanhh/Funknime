import { useEffect } from 'react';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import Icon from './Icon';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { mergeAnimeLists } from '../utils/animeUtils';

const fetchOngoingData = async (page) => {
  const [otakRes, sameRes] = await Promise.all([
    animeAPI.getOngoing(page).catch(() => ({ data: { animeList: [] } })),
    animeAPI.getOngoingSamehadaku().catch(() => ({ data: { animeList: [] } })),
  ]);

  const otakList = otakRes?.data?.animeList || [];
  const sameList = sameRes?.data?.animeList || [];

  return mergeAnimeLists(otakList, sameList);
};

const Ongoing = () => {
  const fetchOngoing = async (page) => {
    const merged = await fetchOngoingData(page);
    return merged;
  };

  const {
    data: animes,
    loading,
    error,
    hasMore,
    lastElementRef,
    reset
  } = useInfiniteScroll(fetchOngoing, []);

  useEffect(() => {
    return () => {
      reset();
    };
    // Cleanup-only effect: reset list state when leaving the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && animes.length === 0) {
    return (
      <div className="anime-list-page main-container">
        <header className="page-header">
          <h1>Sedang Tayang</h1>
          <p className="subtitle">Daftar anime yang saat ini masih on-going dari Otakudesu &amp; Samehadaku.</p>
        </header>
        <section className="section">
          <SkeletonAnimeGrid count={12} />
        </section>
      </div>
    );
  }

  if (error && animes.length === 0) {
    return (
      <div className="anime-list-page main-container">
        <section className="section">
          <div className="error-container">
            <div className="error-icon" aria-hidden><Icon name="alert" size={28} /></div>
            <p className="error-message">Gagal memuat anime sedang tayang: {error}</p>
            <p className="error-hint">Server mungkin sedang bermasalah (mis. error 500). Coba lagi nanti.</p>
            <button type="button" className="btn btn-primary" onClick={reset}>Coba Lagi</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="anime-list-page main-container">
      <header className="page-header">
        <h1>Sedang Tayang</h1>
        <p className="subtitle">Anime yang sedang tayang dari Otakudesu &amp; Samehadaku.</p>
        {error && <p className="error-message">{error}</p>}
      </header>

      <section className="section">
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
                statusOverride="Ongoing"
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

export default Ongoing;
