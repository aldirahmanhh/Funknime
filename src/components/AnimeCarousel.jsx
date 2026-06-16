import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { normalizeAnime } from './AnimeCard';
import './AnimeCarousel.css';

const AnimeCarousel = ({ items = [], maxItems = 8 }) => {
  const [index, setIndex] = useState(0);
  const list = (items || []).slice(0, maxItems);
  const total = list.length;

  const goNext = useCallback(() => setIndex((i) => (i >= total - 1 ? 0 : i + 1)), [total]);
  const goPrev = useCallback(() => setIndex((i) => (i <= 0 ? total - 1 : i - 1)), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(goNext, 5000);
    return () => clearInterval(id);
  }, [total, goNext]);

  if (list.length === 0) return null;

  return (
    <div className="carousel">
      <div className="carousel-viewport">
        <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {list.map((anime, idx) => {
            const { animeId, title, posterUrl } = normalizeAnime(anime, idx);
            return (
              <div key={animeId ?? idx} className="carousel-slide">
                <img
                  src={posterUrl}
                  alt={title}
                  className="carousel-img"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding={idx === 0 ? 'sync' : 'async'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  width={600}
                  height={340}
                />
                <div className="carousel-gradient" />
                <div className="carousel-content">
                  <h3 className="carousel-title">{title}</h3>
                  <Link to={`/anime/${animeId}`} className="btn btn-primary carousel-cta">
                    Nonton Sekarang
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button type="button" className="carousel-arrow carousel-arrow--prev" onClick={goPrev} aria-label="Sebelumnya">‹</button>
            <button type="button" className="carousel-arrow carousel-arrow--next" onClick={goNext} aria-label="Selanjutnya">›</button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="carousel-dots">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimeCarousel;
