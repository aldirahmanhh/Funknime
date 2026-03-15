import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import './AZList.css';

const AZList = () => {
  const [unlimitedList, setUnlimitedList] = useState([]);
  const [letters, setLetters] = useState([]);
  const [animeByLetter, setAnimeByLetter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);

  const allAnime = useMemo(() => {
    return (unlimitedList || []).flatMap((g) => g.animeList ?? []);
  }, [unlimitedList]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await animeAPI.getUnlimited();
        if (cancelled) return;
        const list = res?.data?.list ?? res?.list ?? [];
        setUnlimitedList(Array.isArray(list) ? list : []);
        const startWiths = (Array.isArray(list) ? list : []).map((x) => x.startWith).filter(Boolean);
        setLetters([...new Set(startWiths)].sort((a, b) => {
          if (a === '#') return 1;
          if (b === '#') return -1;
          const numA = /^\d$/.test(a) ? parseInt(a, 10) : a.charCodeAt(0);
          const numB = /^\d$/.test(b) ? parseInt(b, 10) : b.charCodeAt(0);
          return numA - numB;
        }));
      } catch (err) {
        if (cancelled) return;
        const msg = (err?.message ?? (typeof err?.toString === 'function' ? err.toString() : String(err))) || 'Gagal memuat daftar A-Z';
        setError(String(msg));
        console.error('A-Z fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    if (letter == null) {
      setAnimeByLetter(allAnime);
      return;
    }
    const group = unlimitedList.find((x) => x.startWith === letter);
    setAnimeByLetter(group?.animeList ?? []);
  };

  useEffect(() => {
    if (selectedLetter == null && allAnime.length > 0 && animeByLetter.length === 0) {
      setAnimeByLetter(allAnime);
    }
  }, [selectedLetter, allAnime, animeByLetter.length]);

  if (error != null && error !== '' && !loading) {
    return (
      <div className="main-container">
        <ErrorPage
          title="Daftar A-Z"
          message={`Gagal memuat daftar A-Z: ${error}`}
          hint="Server mungkin sedang bermasalah (mis. error 500). Coba lagi nanti."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="az-list-page main-container">
      <header className="page-header az-header az-hero">
        <h1 className="main-title text-gradient">Daftar A-Z</h1>
        <p className="subtitle">Jelajahi anime berdasarkan abjad</p>
      </header>

      {loading ? (
        <div className="az-loading loading-container">
          <div className="spinner" aria-hidden />
          <p>Memuat daftar A-Z...</p>
        </div>
      ) : (
        <>
          <section className="az-alphabet-section section section-neo">
            <h2 className="az-section-label section-title-neo">Pilih Huruf</h2>
            <div className="alphabet-bar">
              <div className="letter-buttons">
                <button
                  type="button"
                  className={`letter-btn ${!selectedLetter ? 'active' : ''}`}
                  onClick={() => handleLetterClick(null)}
                  aria-pressed={!selectedLetter}
                >
                  All
                </button>
                {letters.map((letter, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`letter-btn ${selectedLetter === letter ? 'active' : ''}`}
                    onClick={() => handleLetterClick(letter)}
                    aria-pressed={selectedLetter === letter}
                    aria-label={`Anime huruf ${letter}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {selectedLetter != null && animeByLetter.length === 0 && (
            <div className="az-no-data no-data">Tidak ada anime untuk &quot;{selectedLetter}&quot;.</div>
          )}

          {animeByLetter.length > 0 && (
            <section className="az-results-section section section-neo">
              <div className="section-header section-header-neo">
                <h2 className="section-title section-title-neo">
                  {selectedLetter == null ? 'Semua Anime' : `Anime — ${selectedLetter}`}
                </h2>
                <span className="az-results-count">{animeByLetter.length} anime</span>
              </div>
              <ul className="az-anime-list" aria-label="Daftar anime">
                {animeByLetter.map((anime, idx) => {
                  const id = anime.animeId ?? anime.slug ?? idx;
                  const title = anime.title ?? anime.name ?? `Anime ${idx + 1}`;
                  return (
                    <li key={id}>
                      <Link to={`/anime/${id}`} className="az-anime-row">
                        <span className="az-anime-title">{title}</span>
                        <span className="az-anime-arrow" aria-hidden>→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AZList;