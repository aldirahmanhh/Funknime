import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const currentYear = new Date().getFullYear();
  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/ongoing', label: 'Ongoing' },
    { to: '/completed', label: 'Completed' },
    { to: '/genres', label: 'Genres' },
    { to: '/az-list', label: 'A-Z' },
    { to: '/schedule', label: 'Jadwal' },
    { to: '/search', label: 'Cari' },
  ];

  const handleOpenReport = () => setShowReportModal(true);
  const handleCloseReport = () => {
    setShowReportModal(false);
    setReportText('');
  };
  const handleSendReport = () => {
    const subject = encodeURIComponent('[Funknime] Laporan Bug / Error');
    const body = encodeURIComponent(
      `Deskripsi error/bug:\n\n${reportText || '(Jelaskan masalah yang kamu temukan)'}\n\n---\nHalaman: ${typeof window !== 'undefined' ? window.location.href : ''}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    handleCloseReport();
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-emoji" aria-hidden>🔥</span>
              <span className="footer-text">Funknime</span>
            </Link>
            <p className="footer-tagline">Streaming anime sub Indonesia. Nonton anime terbaru online.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <ul className="footer-links">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer-link">{label}</Link>
                </li>
              ))}
              <li>
                <button type="button" className="footer-link footer-link-btn" onClick={handleOpenReport}>
                  Lapor Bug
                </button>
              </li>
            </ul>
          </nav>
          <div className="footer-bottom">
            <p className="footer-copy">© {currentYear} Funknime. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>

      {showReportModal && (
        <div className="report-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
          <div className="report-modal">
            <h2 id="report-modal-title" className="report-modal-title">Lapor Error / Bug</h2>
            <p className="report-modal-desc">Jelaskan error atau bug yang kamu temukan. Laporan akan dikirim via email.</p>
            <textarea
              className="report-modal-textarea"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Contoh: Tombol Download Batch tidak berfungsi di halaman detail anime..."
              rows={4}
              aria-label="Deskripsi bug"
            />
            <div className="report-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCloseReport}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={handleSendReport}>Buka Email</button>
            </div>
            <button type="button" className="report-modal-close" onClick={handleCloseReport} aria-label="Tutup">✕</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
