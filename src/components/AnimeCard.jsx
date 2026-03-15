import { Link } from 'react-router-dom';

/**
 * Normalizes anime item from different API responses (otakudesu, anoboy, etc.)
 * status from API: "Ongoing" | "Completed" or similar
 */
const normalizeAnime = (anime, index = 0) => {
  const animeId = anime.animeId ?? anime.slug ?? anime.id;
  const title = anime.title ?? anime.name ?? `Anime ${index + 1}`;
  const posterUrl = anime.poster ?? anime.poster_url ?? anime.cover_image ?? anime.thumbnail
    ?? `https://via.placeholder.com/200x280/2e2e2e/6366f1?text=${encodeURIComponent(title)}`;
  const episodes = anime.episodes ?? anime.episodeCount ?? anime.episode_count ?? 0;
  const score = anime.score ?? anime.rating ?? null;
  const releaseDay = anime.releaseDay ?? anime.schedule ?? anime.latestReleaseDate ?? '';
  const rawStatus = (anime.status ?? anime.statusAnime ?? '').toString().trim().toLowerCase();
  const isCompleted = rawStatus === 'completed' || rawStatus === 'selesai' || rawStatus === 'tamat';

  return { animeId, title, posterUrl, episodes, score, releaseDay, isCompleted, rawStatus };
};

const AnimeCard = ({ anime, index = 0, innerRef, statusOverride }) => {
  const normalized = normalizeAnime(anime, index);
  const { animeId, title, posterUrl, episodes, score, releaseDay, isCompleted, rawStatus } = normalized;
  const useOverride = statusOverride && (statusOverride.toLowerCase() === 'ongoing' || statusOverride.toLowerCase() === 'completed');
  const isCompletedBadge = useOverride ? statusOverride.toLowerCase() === 'completed' : isCompleted;
  const showBadge = useOverride || rawStatus === 'ongoing' || (normalized.isCompleted === true);

  return (
    <Link
      ref={innerRef}
      to={`/anime/${animeId}`}
      className="anime-card card"
      title={title}
    >
      <div className="card-image-wrapper">
        {showBadge && (
          <span className={`anime-card-badge anime-card-badge--${isCompletedBadge ? 'completed' : 'ongoing'}`}>
            {isCompletedBadge ? 'Completed' : 'Ongoing'}
          </span>
        )}
        <img
          src={posterUrl}
          alt={title}
          className="poster"
          loading="lazy"
        />
        <div className="card-overlay">
          <span className="play-icon" aria-hidden>▶</span>
        </div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {episodes > 0 && (
            <span className="episode-count">📺 {episodes} eps</span>
          )}
          {score && (
            <span className="score">⭐ {score}</span>
          )}
          {releaseDay && (
            <span className="release-day">🗓️ {releaseDay}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;
export { normalizeAnime };
