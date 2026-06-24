import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchHistory, clearWatchHistory, formatTime } from '../utils/watchHistory';

const WatchHistory = () => {
  const [history, setHistory] = useState(() => getWatchHistory());

  const handleClear = () => {
    clearWatchHistory();
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="main-container">
        <header className="page-header">
          <h1 className="main-title text-gradient">Riwayat Tonton</h1>
          <p className="subtitle">Belum ada anime yang kamu tonton.</p>
        </header>
        <div className="empty-state">
          <p>Mulai nonton anime untuk melihat riwayat di sini!</p>
          <Link to="/ongoing" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Anime</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="main-title text-gradient">Riwayat Tonton</h1>
        <p className="subtitle">Lanjutkan anime yang terakhir kamu tonton.</p>
        <button type="button" className="btn btn-secondary" onClick={handleClear} style={{ marginTop: '12px' }}>
          🗑️ Hapus Riwayat
        </button>
      </header>

      <div className="anime-grid">
        {history.map((item, idx) => (
          <Link
            key={`${item.animeId}-${item.episodeId}-${idx}`}
            to={`/watch/${item.episodeId}`}
            state={{ provider: item.provider, backAnimeId: item.animeId }}
            className="anime-card card"
          >
            <div className="card-image-wrapper">
              <span className="anime-card-badge anime-card-badge--ongoing">Lanjut</span>
              {item.poster && <img src={item.poster} alt={item.animeTitle} className="poster" loading="lazy" decoding="async" />}
              <div className="card-overlay">
                <span className="play-icon" aria-hidden>▶</span>
              </div>
              {/* Progress bar */}
              {item.currentTime > 0 && item.duration > 0 && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '3px', background: 'rgba(255,255,255,0.2)', zIndex: 3,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((item.currentTime / item.duration) * 100, 100)}%`,
                    background: 'var(--color-primary)',
                    borderRadius: '0 2px 2px 0',
                  }} />
                </div>
              )}
            </div>
            <div className="anime-info">
              <h3>{item.animeTitle}</h3>
              <div className="meta">
                <span className="episode-count">
                  {item.episodeTitle || `Episode ${item.episodeId}`}
                </span>
              </div>
              {item.currentTime > 0 && (
                <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                  ⏱️ {formatTime(item.currentTime)}{item.duration > 0 ? ` / ${formatTime(item.duration)}` : ''}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WatchHistory;
