import { useState, useEffect } from 'react';
import Icon from './Icon';
import './InstallBanner.css';

/**
 * PWA Install Banner — fixed bottom sheet (DESIGN.md §5).
 * surface-2 bg, radius-xl top, safe-area padding, shadow-xl.
 */
const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('pwa_banner_dismissed')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  if (!show || dismissed) return null;

  return (
    <div className="install-banner">
      <img
        src="/icon-192.png"
        alt="MrFunk"
        className="install-banner__icon"
      />
      <div className="install-banner__text">
        <div className="install-banner__name">Install MrFunk</div>
        <div className="install-banner__benefit">Akses lebih cepat, nonton tanpa buka browser</div>
      </div>
      <button onClick={handleInstall} className="btn btn--sm btn-primary install-banner__install">
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="install-banner__close"
        aria-label="Tutup"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};

export default InstallBanner;
