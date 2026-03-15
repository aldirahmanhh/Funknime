import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { normalizeAnime } from './AnimeCard';
import './AnimeCarousel.css';

const AnimeCarousel = ({ items = [], title = 'Anime Populer', maxItems = 12 }) => {
  const [index, setIndex] = useState(0);
  const list = (items || []).slice(0, maxItems);
  const total = list.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= total - 1 ? 0 : i + 1));
    }, 4500);
    return () => clearInterval(id);
  }, [total]);

  if (list.length === 0) return null;

  const goPrev = () => setIndex((i) => (i <= 0 ? total - 1 : i - 1));
  const goNext = () => setIndex((i) => (i >= total - 1 ? 0 : i + 1));

  return (
    <div className="anime-carousel anime-carousel-hero">
      {title && (
        <div className="anime-carousel-header">
          <h2 className="anime-carousel-title">{title}</h2>
        </div>
      )}
      <div className="anime-carousel-viewport">
        <button
          type="button"
          className="anime-carousel-btn anime-carousel-btn-prev"
          onClick={goPrev}
          aria-label="Anime sebelumnya"
          disabled={total <= 1}
        >
          ‹
        </button>
        <div
          className="anime-carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {list.map((anime, idx) => {
            const { animeId, title: t, posterUrl } = normalizeAnime(anime, idx);
            return (
              <div key={animeId ?? idx} className="anime-carousel-item">
                <div className="anime-carousel-card">
                  <div className="anime-carousel-poster-wrap">
                    <img src={posterUrl} alt={t} className="anime-carousel-poster" loading={idx < 2 ? 'eager' : 'lazy'} />
                    <div className="anime-carousel-overlay">
                      <h3 className="anime-carousel-card-title">{t}</h3>
                      <div className="anime-carousel-actions">
                        <Link to={`/anime/${animeId}`} className="anime-carousel-cta anime-carousel-cta-primary">
                          Nonton Sekarang
                        </Link>
                        <Link to={`/anime/${animeId}`} className="anime-carousel-cta anime-carousel-cta-secondary">
                          Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="anime-carousel-btn anime-carousel-btn-next"
          onClick={goNext}
          aria-label="Anime selanjutnya"
          disabled={total <= 1}
        >
          ›
        </button>
      </div>
      {total > 1 && (
        <div className="anime-carousel-dots">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`anime-carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Anime ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimeCarousel;
