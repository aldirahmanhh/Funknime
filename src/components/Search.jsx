import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { animeAPI } from '../services/api';
import AnimeCard from './AnimeCard';

const safeDecode = (s) => {
  try {
    return s ? decodeURIComponent(s) : '';
  } catch {
    return s || '';
  }
};

const Search = () => {
  const { query: queryParam } = useParams();
  const [query, setQuery] = useState(safeDecode(queryParam));
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const results = await animeAPI.searchAll(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Pencarian gagal. Silakan coba lagi.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!queryParam) return;
    const q = safeDecode(queryParam).trim();
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setSearchResults(null);
    animeAPI.searchAll(q)
      .then(setSearchResults)
      .catch((err) => {
        setError('Pencarian gagal. Silakan coba lagi.');
        console.error('Search error:', err);
      })
      .finally(() => setLoading(false));
  }, [queryParam]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
  };

  const hasAnyResults = searchResults && Object.values(searchResults).some((r) => {
    if (!r || r.error) return false;
    if (Array.isArray(r)) return r.length > 0;
    const list = r.data?.animeList ?? r.animeList ?? r.data;
    return Array.isArray(list) ? list.length > 0 : false;
  });

  return (
    <div className="search-page main-container">
      <header className="page-header">
        <h1 className="main-title text-gradient">Cari Anime</h1>
        <p className="subtitle">Cari anime dari berbagai provider</p>
      </header>

      <div className="search-bar-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cari anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
            aria-label="Cari anime"
          />
          <button type="button" className="search-btn btn btn-primary" onClick={() => handleSearch()}>
            Cari
          </button>
          {query && (
            <button type="button" onClick={clearSearch} className="clear-btn" aria-label="Hapus pencarian">
              ×
            </button>
          )}
        </div>

        {loading && (
          <div className="search-loading">
            <div className="spinner" aria-hidden />
            <p>Mencari...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => handleSearch()}>Coba Lagi</button>
        </div>
      )}

      {searchResults && !loading && !hasAnyResults && (
        <div className="empty-state">
          <p className="empty-state-title">Tidak ada hasil untuk &quot;{query}&quot;</p>
          <p className="empty-state-hint">Coba kata kunci lain atau periksa ejaan.</p>
          <Link to="/genres" className="btn btn-secondary">Jelajahi Genre</Link>
        </div>
      )}

      {searchResults && hasAnyResults && (
        <div className="search-results">
          <div className="results-summary">
            <h2>Hasil pencarian &quot;{query}&quot;</h2>
            <p>Ditemukan dari beberapa provider</p>
          </div>

          {Object.entries(searchResults).map(([provider, results]) => {
            if (!results || results.error || (Array.isArray(results) && results.length === 0) || (typeof results === 'object' && Object.keys(results).length === 0)) {
              return null;
            }

            const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
            const providerResults = Array.isArray(results)
              ? results
              : (results?.data?.animeList ?? results?.animeList ?? (Array.isArray(results?.data) ? results.data : []));

            if (!Array.isArray(providerResults) || providerResults.length === 0) {
              return null;
            }

            return (
              <div key={provider} className="provider-results">
                <h3>{providerName} ({providerResults.length} hasil)</h3>
                <div className="anime-grid">
                  {providerResults.map((anime, idx) => (
                    <AnimeCard key={anime.animeId ?? anime.slug ?? idx} anime={anime} index={idx} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Search;