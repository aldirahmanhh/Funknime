import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animeAPI } from '../services/api';

const DonghuaGenres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const response = await animeAPI.getDonghuaGenres();
        const allGenres = response?.data || [];
        const unique = Array.from(new Map(allGenres.map(item => [item.slug, item])).values());
        setGenres(unique);
      } catch (err) {
        setError(err?.message ?? 'Gagal memuat genre');
      } finally {
        setLoading(false);
      }
    };
    fetchGenres();
  }, []);

  const categorize = () => {
    const cats = { genres: [], years: [], seasons: [] };
    genres.forEach(item => {
      if (/^\d{4}$/.test(item.name) && parseInt(item.name) >= 2014) cats.years.push(item);
      else if (/(spring|summer|fall|winter|autumn)\s+\d{4}/i.test(item.name)) cats.seasons.push(item);
      else cats.genres.push(item);
    });
    return cats;
  };

  const { genres: genreList, years, seasons } = categorize();
  const getList = () => {
    if (filter === 'genres') return genreList;
    if (filter === 'years') return years.sort((a, b) => b.name.localeCompare(a.name));
    if (filter === 'seasons') return seasons;
    return genres;
  };
  const list = getList();

  if (loading) return <div className="loading-container main-container"><div className="spinner" /><p>Memuat genre...</p></div>;
  if (error) return <div className="error-container main-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="main-title">Genre Donghua</h1>
        <p className="subtitle">{list.length} kategori</p>
      </header>

      <div className="filter-tabs">
        {[['all', `Semua (${genres.length})`], ['genres', `Genre (${genreList.length})`], ['years', `Tahun (${years.length})`], ['seasons', `Season (${seasons.length})`]].map(([key, label]) => (
          <button key={key} className={`filter-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <div className="genres-grid">
        {list.map((item, idx) => (
          <Link key={item.slug || idx} to={`/donghua-genre/${item.slug}`} className="genre-card">
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DonghuaGenres;
