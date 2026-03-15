import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import AnimeCard from './AnimeCard';
import ErrorPage from './ErrorPage';
import './Genres.css';

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [animeByGenre, setAnimeByGenre] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await animeAPI.getGenres();
        if (cancelled) return;
        const list = data?.data?.genreList ?? data?.genreList ?? (Array.isArray(data) ? data : []);
        setGenres(list);
      } catch (err) {
        if (cancelled) return;
        const msg = (err?.message ?? (typeof err?.toString === 'function' ? err.toString() : String(err))) || 'Gagal memuat genre';
        setError(String(msg));
        console.error('Genres fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleGenreClick = async (genre) => {
    setSelectedGenre(genre);
    setGenreLoading(true);
    setAnimeByGenre([]);
    
    try {
      const slug = genre.genreId ?? genre.slug ?? genre.id ?? genre;
      const data = await animeAPI.getAnimeByGenre(slug);
      setAnimeByGenre(data?.data?.animeList ?? data?.animeList ?? []);
    } catch (err) {
      console.error('Genre anime fetch error:', err);
      setAnimeByGenre([]);
    } finally {
      setGenreLoading(false);
    }
  };

  const GenreCard = ({ genre }) => {
    const genreName = genre.title || genre.name || genre;
    
    return (
      <div 
        className={`genre-card ${selectedGenre === genre ? 'active' : ''}`}
        onClick={() => handleGenreClick(genre)}
      >
        <span className="genre-name">{genreName}</span>
      </div>
    );
  };

  if (error != null && error !== '' && !loading) {
    return (
      <div className="main-container">
        <ErrorPage
          title="Jelajahi Genre"
          message={`Gagal memuat genre: ${error}`}
          hint="Server mungkin sedang bermasalah (mis. error 500). Coba lagi nanti."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="genres-page main-container">
      <header className="page-header genres-header genres-hero">
        <h1 className="main-title text-gradient">Jelajahi Genre</h1>
        <p className="subtitle">Temukan anime berdasarkan genre favorit</p>
      </header>

      {loading ? (
        <div className="genres-loading loading-container">
          <div className="spinner" aria-hidden />
          <p>Memuat genre...</p>
        </div>
      ) : (
        <>
          <section className="genre-section section section-neo">
            <h2 className="genre-section-label section-title-neo">Pilih Genre</h2>
            <div className="genre-grid">
              {Array.isArray(genres) ? genres.map((genre, idx) => (
                <GenreCard key={idx} genre={genre} />
              )) : typeof genres === 'object' && (
                <div className="genre-list">
                  {Object.entries(genres).map(([key, value]) => (
                    <GenreCard key={key} genre={{ id: key, title: value }} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {selectedGenre && (
            <section className="genre-anime-section section section-neo">
              <div className="section-header section-header-neo">
                <h2 className="section-title section-title-neo">{selectedGenre.title || selectedGenre.name || selectedGenre}</h2>
                <button
                  type="button"
                  className="clear-genre-btn btn btn-secondary"
                  onClick={() => {
                    setSelectedGenre(null);
                    setAnimeByGenre([]);
                  }}
                >
                  Hapus Pilihan
                </button>
              </div>

              {genreLoading ? (
                <div className="loading-more">
                  <div className="spinner" aria-hidden />
                  <p>Memuat anime...</p>
                </div>
              ) : animeByGenre.length === 0 ? (
                <p className="no-data">Tidak ada anime di genre ini.</p>
              ) : (
                <div className="anime-grid">
                  {animeByGenre.map((anime, idx) => (
                    <AnimeCard key={anime.animeId ?? anime.slug ?? idx} anime={anime} index={idx} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Genres;