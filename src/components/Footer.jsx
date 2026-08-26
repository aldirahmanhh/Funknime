import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import './Footer.css';

const Footer = () => {
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const year = new Date().getFullYear();

  const handleSendReport = () => {
    const subject = encodeURIComponent('[MrFunk] Laporan Bug');
    const body = encodeURIComponent(`Bug:\n\n${reportText || '(Jelaskan masalah)'}\n\n---\nURL: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowReport(false);
    setReportText('');
  };

  return (
    <>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" className="footer-brand-link">
                <img src="/logo.png" alt="MrFunk" className="footer-logo" />
                <span className="footer-brand-name">MrFunk</span>
              </Link>
              <p className="footer-tagline">
                Tempat nonton anime &amp; donghua sub Indo paling lengkap. Gratis, kualitas terbaik.
              </p>
            </div>

            {/* Jelajahi */}
            <nav className="footer-col" aria-label="Navigasi konten">
              <h4 className="footer-col-title">Jelajahi</h4>
              <Link to="/ongoing" className="footer-link">Anime ongoing</Link>
              <Link to="/completed" className="footer-link">Anime completed</Link>
              <Link to="/donghua-ongoing" className="footer-link">Donghua</Link>
              <Link to="/schedule" className="footer-link">Jadwal tayang</Link>
            </nav>

            {/* Bantuan */}
            <nav className="footer-col" aria-label="Bantuan">
              <h4 className="footer-col-title">Bantuan</h4>
              <button type="button" className="footer-link footer-link-btn" onClick={() => setShowReport(true)}>
                Lapor bug
              </button>
              <a href="https://teer.id/anrizz" target="_blank" rel="noopener noreferrer" className="footer-link">
                Donasi
              </a>
            </nav>

            {/* DonateCard */}
            <div className="footer-donate-card">
              <div className="donate-card-header">
                <Icon name="heart" size={18} className="donate-icon" />
                <h4 className="donate-card-title">Dukung MrFunk</h4>
              </div>
              <p className="donate-card-body">
                Bantu biaya server &amp; domain lewat Trakteer.
              </p>
              <a
                href="https://teer.id/anrizz"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-donate"
              >
                <Icon name="heart" size={15} />
                Dukung MrFunk
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="footer-bottom">
            <p className="footer-copy">
              &copy; {year} MrFunk. All rights reserved.
            </p>
            <p className="footer-disclaimer">
              MrFunk adalah platform streaming anime gratis. Kami tidak menyimpan file video di server kami.
            </p>
          </div>
        </div>
      </footer>

      {/* Report Modal */}
      {showReport && (
        <div className="report-overlay" onClick={() => setShowReport(false)}>
          <div className="report-panel" onClick={e => e.stopPropagation()}>
            <button className="report-close" onClick={() => setShowReport(false)} aria-label="Tutup">
              <Icon name="close" size={18} />
            </button>
            <h2 className="report-title">
              <Icon name="alert" size={18} /> Lapor bug
            </h2>
            <p className="report-hint">Jelaskan error yang kamu temukan.</p>
            <textarea
              className="report-textarea"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Contoh: Video tidak bisa diputar di halaman..."
              rows={4}
            />
            <div className="report-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowReport(false)}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={handleSendReport}>
                <Icon name="external-link" size={15} /> Kirim via email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
