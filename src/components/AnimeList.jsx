import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';

const AnimeList = () => {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnimeData = async () => {
      try {
        const data = await animeAPI.getHome();
        setAnimes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimeData();
  }, []);

  if (loading) return (
    <div className="anime-list-page">
      <header className="page-header">
        <h1>Anime List</h1>
        <p>Browse all available anime</p>
      </header>
      <SkeletonAnimeGrid count={12} />
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <p className="error-message">Failed to load anime: {error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="anime-list-page">
      <header className="page-header">
        <h1>Anime List</h1>
        <p>Browse all available anime</p>
      </header>
      <div className="anime-grid">
        {animes.map((anime, idx) => {
          const animeId = anime.animeId || anime.slug;
          const title = anime.title || anime.name || `Anime ${idx + 1}`;
          const posterUrl = anime.poster || `https://via.placeholder.com/200x280/2e2e2e/6366f1?text=${encodeURIComponent(title)}`;
          
          return (
            <Link
              key={animeId || idx}
              to={`/anime/${animeId}`}
              className="anime-card card"
              title={title}
            >
              <div className="card-image-wrapper">
                <img
                  src={posterUrl}
                  alt={title}
                  className="poster"
                  loading="lazy"
                />
                <div className="card-overlay">
                  <span className="play-icon">▶</span>
                </div>
              </div>
              <div className="anime-info">
                <h3>{title}</h3>
                <div className="meta">
                  {anime.episodes && <span className="episode-count">{anime.episodes} eps</span>}
                  {anime.score && <span className="score">⭐ {anime.score}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AnimeList;