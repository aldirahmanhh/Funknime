import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { animeAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import './Header.css';
import './Search.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      setSearchLoading(true);
      try {
        const data = await animeAPI.search(debouncedQuery);
        const results = data?.data?.slice(0, 5) || [];
        setSuggestions(results);
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
      setQuery(searchQuery);
      closeMobileMenu();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const title = suggestion.title || suggestion.name;
    setQuery(title);
    handleSearch(title);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setShowDropdown(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/ongoing', label: 'Ongoing' },
    { to: '/completed', label: 'Completed' },
    { to: '/genres', label: 'Genres' },
    { to: '/az-list', label: 'A-Z' },
    { to: '/schedule', label: 'Schedule' },
  ];

  return (
    <header className="header">
      <nav className="nav-container" aria-label="Main navigation">
        <div className="nav-brand">
          <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
            <img src="/favicon.svg" alt="Funknime" className="logo-image" />
            <span className="logo-text">Funknime</span>
          </Link>
        </div>

        <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`} role="navigation">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <div className="search-container header-search">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Cari anime..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onKeyDown={handleSearchKeyDown}
                aria-label="Cari anime"
              />
              <button
                type="button"
                className="search-btn"
                onClick={() => handleSearch()}
                aria-label="Cari"
              >
                🔍
              </button>
              {searchLoading && <div className="search-spinner" />}
              {showDropdown && suggestions.length > 0 && (
                <div className="search-dropdown">
                  {suggestions.map((anime, idx) => (
                    <div
                      key={anime.animeId ?? anime.slug ?? idx}
                      className="search-suggestion"
                      onClick={() => handleSuggestionClick(anime)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <img
                        src={anime.poster || anime.poster_url || ''}
                        alt={anime.title || anime.name || 'Anime'}
                        className="suggestion-poster"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/44x64/2e2e2e/666?text=?'; }}
                      />
                      <div className="suggestion-info">
                        <div className="suggestion-title">{anime.title || anime.name}</div>
                        <div className="suggestion-meta">
                          {anime.episodes && <span>{anime.episodes} eps</span>}
                          {anime.score && <span>⭐ {anime.score}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="nav-mobile-menu"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            <span className="hamburger" aria-hidden>
              {mobileMenuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <button
          type="button"
          className="nav-overlay"
          onClick={closeMobileMenu}
          aria-label="Tutup menu"
        />
      )}
    </header>
  );
};

export default Header;
