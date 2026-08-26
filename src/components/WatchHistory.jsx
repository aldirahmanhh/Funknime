import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchHistory, clearWatchHistory, formatTime } from '../utils/watchHistory';
import Icon from './Icon';
import './WatchHistory.css';

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
          <h1>Riwayat Tonton</h1>
          <p className="subtitle">Belum ada anime yang kamu tonton.</p>
        </header>
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="history" size={28} /></div>
          <p>Mulai nonton anime untuk melihat riwayat di sini!</p>
          <Link to="/ongoing" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Browse Anime</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="page-header">
        <h1>Riwayat Tonton</h1>
        <p className="subtitle">Lanjutkan anime yang terakhir kamu tonton.</p>
        <button type="button" className="btn btn-secondary btn--sm" onClick={handleClear} style={{ marginTop: 'var(--space-3)' }}>
          <Icon name="close" size={14} /> Hapus Riwayat
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
                <span className="play-icon" aria-hidden><Icon name="play" size={20} /></span>
              </div>
              {item.currentTime > 0 && item.duration > 0 && (
                <div className="history-progress">
                  <div
                    className="history-progress-fill"
                    style={{ width: `${Math.min((item.currentTime / item.duration) * 100, 100)}%` }}
                  />
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
                <div className="history-time">
                  <Icon name="clock" size={12} /> {formatTime(item.currentTime)}{item.duration > 0 ? ` / ${formatTime(item.duration)}` : ''}
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
