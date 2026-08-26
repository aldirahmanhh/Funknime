import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';
import ErrorPage from './ErrorPage';
import './AZList.css';

const AZList = () => {
  const [allAnime, setAllAnime] = useState([]);
  const [letters, setLetters] = useState([]);
  const [animeByLetter, setAnimeByLetter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [otakRes, sameRes] = await Promise.all([
          animeAPI.getUnlimited(),
          animeAPI.getListSamehadaku().catch(() => null),
        ]);
        if (cancelled) return;

        const otakGroups = otakRes?.data?.list ?? otakRes?.list ?? [];
        const otakItems = Array.isArray(otakGroups)
          ? otakGroups.flatMap((g) =>
              (g.animeList ?? []).map((a) => {
                const title = a.title ?? a.name ?? '';
                const firstChar = (g.startWith || title[0] || '#').toString().toUpperCase();
                return {
                  ...a,
                  title,
                  providers: ['otakudesu'],
                  provider: 'otakudesu',
                  __letter: firstChar,
                };
              }),
            )
          : [];

        let sameItems = [];
        if (sameRes) {
          const root = sameRes?.data ?? sameRes ?? {};
          const raw =
            root.list ??
            root.animeList ??
            (Array.isArray(root) ? root : []);

          if (Array.isArray(raw) && raw.length > 0) {
            // Bentuk grup per huruf: [{ startWith, animeList: [] }, ...]
            if (Array.isArray(raw[0]?.animeList)) {
              sameItems = raw.flatMap((g) =>
                (g.animeList ?? []).map((a) => {
                  const title = a.title ?? a.name ?? '';
                  const firstChar = (g.startWith || title[0] || '#').toString().toUpperCase();
                  const href = a.href || a.url || '';
                  const slugFromHref = href.split('/').filter(Boolean).pop();
                  return {
                    ...a,
                    title,
                    animeId: a.animeId ?? a.slug ?? slugFromHref,
                    providers: ['samehadaku'],
                    provider: 'samehadaku',
                    __letter: firstChar,
                  };
                }),
              );
            } else {
              // Bentuk flat list: animeList: []
              sameItems = raw.map((a) => {
                const title = a.title ?? a.name ?? '';
                const firstChar = (title[0] || '#').toString().toUpperCase();
                const href = a.href || a.url || '';
                const slugFromHref = href.split('/').filter(Boolean).pop();
                return {
                  ...a,
                  title,
                  animeId: a.animeId ?? a.slug ?? slugFromHref,
                  providers: ['samehadaku'],
                  provider: 'samehadaku',
                  __letter: firstChar,
                };
              });
            }
          }
        }

        const normalizeKey = (item) =>
          (item.title || item.name || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();

        const map = new Map();

        [...otakItems, ...sameItems].forEach((item) => {
          const key = normalizeKey(item);
          const existing = map.get(key);
          if (existing) {
            const providers = Array.from(new Set([...(existing.providers || []), ...(item.providers || [])]));
            map.set(key, {
              ...existing,
              ...item,
              providers,
              provider: providers.includes('otakudesu') ? 'otakudesu' : providers[0],
              __letter: (item.__letter || existing.__letter || '#').toString().toUpperCase(),
            });
          } else {
            map.set(key, item);
          }
        });

        const unified = Array.from(map.values());

        const lettersSet = new Set(
          unified
            .map((a) => a.__letter)
            .filter(Boolean)
            .map((c) => c.toString().toUpperCase()),
        );

        const sortedLetters = [...lettersSet].sort((a, b) => {
          if (a === '#') return 1;
          if (b === '#') return -1;
          return a.localeCompare(b);
        });

        unified.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

        setAllAnime(unified);
        setLetters(sortedLetters);
        setAnimeByLetter(unified);
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
    const filtered = allAnime.filter((a) => a.__letter === letter);
    setAnimeByLetter(filtered);
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
      <header className="page-header">
        <h1>Daftar A-Z</h1>
        <p className="subtitle">Jelajahi anime berdasarkan abjad</p>
      </header>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" aria-hidden />
          <p>Memuat daftar A-Z...</p>
        </div>
      ) : (
        <>
          <div className="az-letters">
            <button
              type="button"
              className="az-letter-btn"
              onClick={() => handleLetterClick(null)}
              aria-pressed={selectedLetter == null}
            >
              All
            </button>
            {letters.map((letter, idx) => (
              <button
                key={idx}
                type="button"
                className="az-letter-btn"
                onClick={() => handleLetterClick(letter)}
                aria-pressed={selectedLetter === letter}
                aria-label={`Anime huruf ${letter}`}
              >
                {letter}
              </button>
            ))}
          </div>

          {selectedLetter != null && animeByLetter.length === 0 && (
            <div className="az-result-count">Tidak ada anime untuk &quot;{selectedLetter}&quot;.</div>
          )}

          {animeByLetter.length > 0 && (
            <section className="az-results-section">
              <div className="az-result-count">
                {selectedLetter == null ? 'Semua anime' : `Anime — ${selectedLetter}`} &middot; {animeByLetter.length} anime
              </div>
              <ul className="az-anime-list" aria-label="Daftar anime">
                {animeByLetter.map((anime, idx) => {
                  const id = anime.animeId ?? anime.slug ?? idx;
                  const title = anime.title ?? anime.name ?? `Anime ${idx + 1}`;
                  const providers = Array.isArray(anime.providers) ? anime.providers : (anime.provider ? [anime.provider] : []);
                  const hasOtak = providers.includes('otakudesu');
                  const hasSame = providers.includes('samehadaku');
                  const primaryProvider = hasOtak ? 'otakudesu' : (hasSame ? 'samehadaku' : (providers[0] || 'otakudesu'));

                  return (
                    <li key={id}>
                      <Link to={`/anime/${primaryProvider}/${id}`} className="az-anime-row">
                        <span className="az-anime-title">{title}</span>
                        <span className="az-anime-providers">
                          {hasOtak && <span className="chip" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>Otakudesu</span>}
                          {hasSame && <span className="chip" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>Samehadaku</span>}
                        </span>
                        <span className="az-anime-arrow" aria-hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>
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
