import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { animeAPI, comicAPI } from '../services/api';
import AnimeCard from './AnimeCard';
import Icon from './Icon';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};
const placeholderImg = (text) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">` +
    `<rect width="200" height="280" fill="#1a1a26"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#9333EA" font-family="sans-serif" font-size="14" font-weight="bold">` +
    (text || 'Komik').substring(0, 16) +
    `</text></svg>`
  )}`;

const SearchKomikCard = ({ comic }) => {
  const { slug, title, poster, chapter, type, rating } = comic;
  const posterUrl = poster ? proxyImage(poster) : placeholderImg(title);
  return (
    <Link to={`/komik/${slug}`} className="anime-card card" title={title}>
      <div className="card-image-wrapper">
        {type && <span className="anime-card-badge anime-card-badge--ongoing">{type}</span>}
        <img src={posterUrl} alt={title} className="poster" loading="lazy" decoding="async" width={200} height={280} referrerPolicy="no-referrer"
          onError={(e) => { const f = placeholderImg(title); if (e.target.src !== f) e.target.src = f; }} />
        <div className="card-overlay"><span className="play-icon" aria-hidden="true"><Icon name="book" size={20} /></span></div>
      </div>
      <div className="anime-info">
        <h3>{title}</h3>
        <div className="meta">
          {chapter && <span className="episode-count">{chapter}</span>}
          {rating && <span className="score"><Icon name="star" size={12} /> {rating}</span>}
        </div>
      </div>
    </Link>
  );
};

const UnifiedSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [animeResults, setAnimeResults] = useState([]);
  const [donghuaResults, setDonghuaResults] = useState([]);
  const [komikResults, setKomikResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const [animeRes, donghuaRes, komikRes] = await Promise.all([
        animeAPI.search(searchQuery).catch(() => ({ data: { animeList: [] } })),
        animeAPI.searchDonghua(searchQuery).catch(() => ({ data: [] })),
        comicAPI.searchComics(searchQuery, { page: 1 }).catch(() => ({ comics: [] })),
      ]);

      const animeList = animeRes?.data?.animeList || [];
      const donghuaList = Array.isArray(donghuaRes?.data) ? donghuaRes.data : [];
      const komikList = komikRes?.comics || [];

      setAnimeResults(animeList);
      setDonghuaResults(donghuaList);
      setKomikResults(komikList);
    } catch (err) {
      setError(err?.message ?? 'Gagal mencari');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  const getFilteredResults = () => {
    switch (activeTab) {
      case 'anime': return { anime: animeResults, donghua: [], komik: [] };
      case 'donghua': return { anime: [], donghua: donghuaResults, komik: [] };
      case 'komik': return { anime: [], donghua: [], komik: komikResults };
      default: return { anime: animeResults, donghua: donghuaResults, komik: komikResults };
    }
  };

  const { anime, donghua, komik } = getFilteredResults();
  const totalResults = animeResults.length + donghuaResults.length + komikResults.length;

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="main-title">Search</h1>
        <p className="subtitle">Cari anime, donghua, atau komik</p>
      </header>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari anime, donghua, atau komik..."
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">Cari</button>
      </form>

      {query && !loading && (
        <div className="filter-tabs">
          <button className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            Semua ({totalResults})
          </button>
          <button className={`filter-tab ${activeTab === 'anime' ? 'active' : ''}`} onClick={() => setActiveTab('anime')}>
            <Icon name="monitor" size={14} /> Anime ({animeResults.length})
          </button>
          <button className={`filter-tab ${activeTab === 'donghua' ? 'active' : ''}`} onClick={() => setActiveTab('donghua')}>
            <Icon name="flame" size={14} /> Donghua ({donghuaResults.length})
          </button>
          <button className={`filter-tab ${activeTab === 'komik' ? 'active' : ''}`} onClick={() => setActiveTab('komik')}>
            <Icon name="book" size={14} /> Komik ({komikResults.length})
          </button>
        </div>
      )}

      {loading && <div className="loading-container"><div className="spinner" /></div>}

      {error && <div className="error-hint">{error}</div>}

      {!loading && query && (
        <>
          {anime.length > 0 && (
            <section className="section">
              <h2 className="section-title">Anime ({anime.length})</h2>
              <div className="anime-grid">
                {anime.map((item, idx) => (
                  <AnimeCard key={item.animeId || idx} anime={{ ...item, provider: 'otakudesu' }} index={idx} providerHint="Anime" />
                ))}
              </div>
            </section>
          )}

          {donghua.length > 0 && (
            <section className="section">
              <h2 className="section-title">Donghua ({donghua.length})</h2>
              <div className="anime-grid">
                {donghua.map((item, idx) => (
                  <AnimeCard key={item.slug || idx} anime={{ ...item, animeId: item.slug, provider: 'donghua' }} index={idx} providerHint="Donghua" />
                ))}
              </div>
            </section>
          )}

          {komik.length > 0 && (
            <section className="section">
              <h2 className="section-title">Komik ({komik.length})</h2>
              <div className="anime-grid">
                {komik.map((comic, idx) => (
                  <SearchKomikCard key={comic.slug ?? idx} comic={comic} />
                ))}
              </div>
            </section>
          )}

          {anime.length === 0 && donghua.length === 0 && komik.length === 0 && (
            <div className="empty-state">
              <p>Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                <Link to="/ongoing" className="btn btn-primary">Browse Anime</Link>
                <Link to="/donghua-ongoing" className="btn btn-secondary">Browse Donghua</Link>
                <Link to="/komik" className="btn btn-secondary">Browse Komik</Link>
              </div>
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="empty-state">
          <p>Masukkan kata kunci untuk mencari anime, donghua, atau komik</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
