import { Link } from 'react-router-dom';
import Icon from './Icon';

const POSTER_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect width="200" height="280" fill="#181822"/><text x="100" y="146" font-family="sans-serif" font-size="56" fill="#2C2C3A" text-anchor="middle">?</text></svg>'
  );

// eslint-disable-next-line react-refresh/only-export-components
export const normalizeAnime = (anime, index = 0) => {
  const animeId = anime.animeId ?? anime.slug ?? anime.id;
  const title = anime.title ?? anime.name ?? `Anime ${index + 1}`;
  const posterUrl = anime.poster ?? anime.poster_url ?? anime.cover_image ?? anime.thumbnail
    ?? POSTER_FALLBACK;
  const episodes = anime.episodes ?? anime.episodeCount ?? anime.episode_count ?? 0;
  const score = anime.score ?? anime.rating ?? null;
  const releaseDay = anime.releaseDay ?? anime.schedule ?? anime.latestReleaseDate ?? '';
  const rawStatus = (anime.status ?? anime.statusAnime ?? '').toString().trim().toLowerCase();
  const isCompleted = rawStatus === 'completed' || rawStatus === 'selesai' || rawStatus === 'tamat';

  const rawProvider = anime.provider ?? anime.source ?? anime.site ?? null;
  let providerLabel = null;
  if (typeof rawProvider === 'string' && rawProvider.trim() !== '') {
    const p = rawProvider.trim().toLowerCase();
    if (p.includes('samehadaku')) providerLabel = 'Samehadaku';
    else if (p.includes('stream')) providerLabel = 'Stream';
    else if (p.includes('donghua')) providerLabel = 'Donghua';
    else if (p.includes('otakudesu') || p === 'default') providerLabel = 'Otakudesu';
    else providerLabel = rawProvider;
  }

  return { animeId, title, posterUrl, episodes, score, releaseDay, isCompleted, rawStatus, providerLabel };
};

const AnimeCard = ({ anime, index = 0, innerRef, statusOverride, providerHint }) => {
  const normalized = normalizeAnime(anime, index);
  const { animeId, title, posterUrl, episodes, score, releaseDay, isCompleted, rawStatus, providerLabel } = normalized;

  const useOverride = statusOverride && (statusOverride.toLowerCase() === 'ongoing' || statusOverride.toLowerCase() === 'completed');
  const isCompletedBadge = useOverride ? statusOverride.toLowerCase() === 'completed' : isCompleted;
  const showBadge = useOverride || rawStatus === 'ongoing' || normalized.isCompleted === true;

  const finalProvider = providerHint || providerLabel || null;
  const providerKey = typeof anime.provider === 'string' && anime.provider.trim()
    ? anime.provider.trim().toLowerCase() : null;

  const detailPath = providerKey === 'donghua'
    ? `/donghua/${animeId}`
    : providerKey
      ? `/anime/${providerKey}/${animeId}`
      : `/anime/${animeId}`;

  return (
    <Link ref={innerRef} to={detailPath} className="anime-card card" title={title}>
      <div className="card-image-wrapper">
        {showBadge && (
          <span className={`anime-card-badge anime-card-badge--${isCompletedBadge ? 'completed' : 'ongoing'}`}>
            {isCompletedBadge ? 'Completed' : 'Ongoing'}
          </span>
        )}
        <img src={posterUrl} alt={`${title} poster`} className="poster" loading="lazy" decoding="async" width={200} height={280} />
        <div className="card-overlay">
          <span className="play-icon"><Icon name="play" size={20} /></span>
        </div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {episodes > 0 && <span className="episode-count num">{episodes} eps</span>}
          {score && <span className="score num"><Icon name="star" size={12} /> {score}</span>}
          {releaseDay && <span className="release-day">{releaseDay}</span>}
        </div>
        {finalProvider && (
          <span className="card-provider-tag">{finalProvider}</span>
        )}
      </div>
    </Link>
  );
};

export default AnimeCard;
// eslint-disable-next-line react-refresh/only-export-components
export { normalizeAnime as normalizeAnimeExport };
