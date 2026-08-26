import { useState, useRef, useCallback } from 'react';
import Icon from './Icon';
import './EmbedPlayer.css';

const EmbedPlayer = ({ src, title, onLoad }) => {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
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
    const el = iframeRef.current;
    if (el) el.src = src;
  };

  return (
    <div className="embed-player">
      {!loaded && (
        <div className="embed-player__loader">
          <div className="spinner" />
          <p className="embed-player__loader-text">Memuat player...</p>
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
