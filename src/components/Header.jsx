import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import './Header.css';

const TRAKTEER_URL = 'https://teer.id/anrizz';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Reset UI state on navigation - legitimate use of setState in effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileMenuOpen(false); setOpenDropdown(null); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => { setMobileMenuOpen(false); setOpenDropdown(null); };
  const toggleDropdown = (label) => setOpenDropdown((prev) => (prev === label ? null : label));

  const navLinks = [
    { to: '/', label: 'Home' },
    { label: 'Anime', submenu: [
      { to: '/ongoing', label: 'Ongoing' },
      { to: '/completed', label: 'Completed' },
      { to: '/az-list', label: 'A-Z List' },
    ]},
    { label: 'Donghua', submenu: [
      { to: '/donghua-ongoing', label: 'Ongoing' },
      { to: '/donghua-completed', label: 'Completed' },
      { to: '/donghua-genres', label: 'Genres' },
      { to: '/donghua-az', label: 'A-Z List' },
    ]},
    { to: '/genres', label: 'Genres' },
    { label: 'Komik', submenu: [
      { to: '/komik', label: 'Terbaru' },
      { to: '/komik/genres', label: 'Genres' },
      { to: '/komik/berwarna', label: 'Berwarna' },
      { to: '/komik/type/manga', label: 'Manga' },
      { to: '/komik/type/manhwa', label: 'Manhwa' },
      { to: '/komik/type/manhua', label: 'Manhua' },
    ]},
    { to: '/schedule', label: 'Jadwal' },
    { to: '/history', label: 'Riwayat' },
  ];

  return (
    <>
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <nav className="nav-container" aria-label="Navigasi utama">
          <div className="nav-brand">
            <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
              <img src="/logo.png" alt="MrFunk" className="logo-image" width="36" height="36" />
              <span className="logo-text">MrFunk</span>
            </Link>
          </div>
          <div id="primary-navigation" className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {navLinks.map((link) => {
              if (link.submenu) {
                const isOpen = openDropdown === link.label;
                const childActive = link.submenu.some((s) => location.pathname === s.to);
                return (
                  <div key={link.label} className={`nav-dropdown ${isOpen ? 'open' : ''}`}>
                    <button type="button" className={`nav-link dropdown-trigger ${childActive ? 'child-active' : ''}`} onClick={() => toggleDropdown(link.label)} aria-expanded={isOpen} aria-haspopup="true">
                      {link.label}
                      <Icon name="chevron-down" size={14} className={`dropdown-arrow-icon ${isOpen ? 'rotated' : ''}`} />
                    </button>
                    <div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
                      {link.submenu.map((sub) => (
                        <Link key={sub.to} to={sub.to} className={`dropdown-item ${location.pathname === sub.to ? 'active' : ''}`} onClick={closeMobileMenu}>{sub.label}</Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return <Link key={link.to} to={link.to} className={`nav-link ${location.pathname === link.to ? 'active' : ''}`} aria-current={location.pathname === link.to ? 'page' : undefined} onClick={closeMobileMenu}>{link.label}</Link>;
            })}
            {/* Donate inside the mobile sheet so it is reachable everywhere */}
            <a href={TRAKTEER_URL} target="_blank" rel="noopener noreferrer" className="btn btn--lg btn-donate nav-donate-mobile" onClick={closeMobileMenu}>
              <Icon name="heart" size={18} />
              Dukung MrFunk
            </a>
          </div>
          <div className="nav-actions">
            <Link to="/search" className="icon-btn nav-search-link" onClick={closeMobileMenu} aria-label="Cari anime dan komik">
              <Icon name="search" size={19} />
            </Link>
            <a href={TRAKTEER_URL} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn-donate nav-donate-desktop">
              <Icon name="heart" size={15} />
              Dukung
            </a>
            <button type="button" className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(p => !p)} aria-expanded={mobileMenuOpen} aria-controls="primary-navigation" aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}>
              <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
            </button>
          </div>
        </nav>
      </header>
      {mobileMenuOpen && <div className="mobile-overlay open" onClick={closeMobileMenu} />}
    </>
  );
};

export default Header;
