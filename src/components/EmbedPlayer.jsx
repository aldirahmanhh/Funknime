import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from './Icon';
import './EmbedPlayer.css';

// slowTimeoutMs: embed hosts (e.g. vidhide) sometimes take 20s+ or hang.
// After the timeout without onLoad, show an inline escape hatch instead of
// an endless spinner.
const EmbedPlayer = ({ src, title, onLoad, onTryNext, slowTimeoutMs = 15000 }) => {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!src) return undefined;
    const t = setTimeout(() => setSlow(true), slowTimeoutMs);
    return () => clearTimeout(t);
  }, [src, slowTimeoutMs]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setSlow(false);
    onLoad?.();
  }, [onLoad]);

  const toggleFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
    }
  };

  const reloadIframe = () => {
    setLoaded(false);
    setSlow(false);
    const el = iframeRef.current;
    if (el) el.src = src;
  };

  return (
    <div className="embed-player">
      {!loaded && (
        <div className="embed-player__loader">
          <div className="spinner" />
          <p className="embed-player__loader-text">Memuat player...</p>
          {slow && (
            <div className="embed-player__slow">
              <p className="embed-player__slow-text">Server lambat merespons.</p>
              <div className="embed-player__slow-actions">
                {onTryNext && (
                  <button type="button" className="btn btn-primary" onClick={onTryNext}>
                    <Icon name="refresh" size={14} /> Coba server lain
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={reloadIframe}>
                  Muat ulang
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        title={title}
        onLoad={handleLoad}
        className="embed-player__iframe"
        style={{ opacity: loaded ? 1 : 0 }}
      />

      {loaded && (
        <div className="embed-player__controls">
          <button type="button" className="embed-player__btn" onClick={reloadIframe} title="Reload" aria-label="Reload">
            <Icon name="refresh" size={14} />
          </button>
          <button type="button" className="embed-player__btn" onClick={toggleFullscreen} title="Fullscreen" aria-label="Fullscreen">
            <Icon name="external-link" size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmbedPlayer;
