import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getWatchHistory, clearWatchHistory, formatTime as fmtAnime } from '../utils/watchHistory';
import { getDonghuaHistory, clearDonghuaHistory, formatTime as fmtDong } from '../utils/donghuaHistory';
import { getKomikHistory, clearKomikHistory, parseChapterNum } from '../utils/komikHistory';
import Icon from './Icon';
import './WatchHistory.css';

const WatchHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'anime';
  const normalizedTab = tab === 'anime' || tab === 'donghua' || tab === 'komik' ? tab : 'anime';

  const [animeHistory, setAnimeHistory] = useState(() => getWatchHistory());
  const [donghuaHistory, setDonghuaHistory] = useState(() => getDonghuaHistory());
  const [komikHistory, setKomikHistory] = useState(() => getKomikHistory());

  const handleClearAnime = () => {
    clearWatchHistory();
    setAnimeHistory([]);
  };
  const handleClearDonghua = () => {
    clearDonghuaHistory();
    setDonghuaHistory([]);
  };
  const handleClearKomik = () => {
    clearKomikHistory();
    setKomikHistory([]);
  };
  const handleClearAll = () => {
    clearWatchHistory();
    clearDonghuaHistory();
    clearKomikHistory();
    setAnimeHistory([]);
    setDonghuaHistory([]);
    setKomikHistory([]);
  };

  const handleTabChange = (newTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    setSearchParams(params);
  };

  const tabLabels = {
    anime: 'Anime',
    donghua: 'Donghua',
    komik: 'Komik',
  };

  const tabSubtitles = {
    anime: 'Lanjutkan anime yang terakhir kamu tonton.',
    donghua: 'Lanjutkan donghua yang terakhir kamu tonton.',
    komik: 'Lanjutkan membaca komik yang terakhir kamu baca.',
  };

  const renderAnimeGrid = () => {
    const items = animeHistory;
    if (items.length === 0) return null;
    return (
      <div className="anime-grid">
        {items.map((item, idx) => (
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
                  <Icon name="clock" size={12} /> {fmtAnime(item.currentTime)}{item.duration > 0 ? ` / ${fmtAnime(item.duration)}` : ''}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderDonghuaGrid = () => {
    const items = donghuaHistory;
    if (items.length === 0) return null;
    return (
      <div className="anime-grid">
        {items.map((item, idx) => (
          <Link
            key={`${item.animeId}-${item.episodeId}-${idx}`}
            to={`/watch/${item.episodeId}`}
            state={{ provider: 'donghua', backAnimeId: item.animeId }}
            className="anime-card card"
          >
            <div className="card-image-wrapper">
              <span className="anime-card-badge anime-card-badge--ongoing">Donghua · Lanjut</span>
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
                  <Icon name="clock" size={12} /> {fmtDong(item.currentTime)}{item.duration > 0 ? ` / ${fmtDong(item.duration)}` : ''}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderKomikGrid = () => {
    const items = komikHistory;
    if (items.length === 0) return null;
    return (
      <div className="anime-grid">
        {items.map((item, idx) => {
          const chapterNum = parseChapterNum(item.chapterSlug) || '?';
          const badgeText = `Baca · Ch ${chapterNum}`;
          const lastPage = item.lastPageIndex !== undefined ? item.lastPageIndex + 1 : '?';
          const totalImages = item.totalImages !== undefined ? item.totalImages : '?';
          const progressText = `${lastPage}/${totalImages} hal`;
          const scrollProgressPct = item.scrollProgress !== undefined ? `${Math.round(item.scrollProgress)}%` : '0%';
          return (
            <Link
              key={`${item.komikSlug}-${item.chapterSlug}-${idx}`}
              to={`/komik/read/${item.chapterSlug}`}
              className="anime-card card"
            >
              <div className="card-image-wrapper">
                <span className="anime-card-badge anime-card-badge--ongoing">{badgeText}</span>
                {item.poster && <img src={item.poster} alt={item.chapterTitle || item.komikTitle} className="poster" loading="lazy" decoding="async" />}
                <div className="card-overlay">
                  <span className="play-icon" aria-hidden><Icon name="book" size={20} /></span>
                </div>
                <div className="history-progress">
                  <div
                    className="history-progress-fill"
                    style={{ width: `${Math.min(item.scrollProgress || 0, 100)}%` }}
                  />
                </div>
              </div>
              <div className="anime-info">
                <h3>{item.chapterTitle || item.komikTitle}</h3>
                <div className="meta">
                  <span className="episode-count">{progressText} · {scrollProgressPct}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderEmptyState = (tabKey) => {
    const labels = {
      anime: { subtitle: 'Belum ada anime yang kamu tonton.', cta: 'Browse Anime', ctaLink: '/ongoing' },
      donghua: { subtitle: 'Belum ada donghua yang kamu tonton.', cta: 'Browse Donghua', ctaLink: '/donghua-ongoing' },
      komik: { subtitle: 'Belum ada komik yang kamu baca.', cta: 'Browse Komik', ctaLink: '/komik' },
    };
    const { subtitle, cta, ctaLink } = labels[tabKey] || labels.anime;
    return (
      <div className="main-container">
        <header className="page-header">
          <h1>Riwayat</h1>
          <p className="subtitle">{subtitle}</p>
        </header>
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="history" size={28} /></div>
          <p>{subtitle}</p>
          <Link to={ctaLink} className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>{cta}</Link>
        </div>
      </div>
    );
  };

  const historyForTab = {
    anime: animeHistory,
    donghua: donghuaHistory,
    komik: komikHistory,
  }[normalizedTab];

  if (historyForTab.length === 0) {
    return (
      <>
        <div className="main-container">
          <header className="page-header">
            <h1>Riwayat</h1>
            <p className="subtitle">{tabSubtitles[normalizedTab]}</p>
          </header>
          <div className="filter-tabs" role="radiogroup" aria-label="Filter riwayat">
            {Object.keys(tabLabels).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={normalizedTab === t}
                aria-pressed={normalizedTab === t}
                className={`filter-tab${normalizedTab === t ? ' filter-tab--active active' : ''}`}
                onClick={() => handleTabChange(t)}
              >
                {tabLabels[t]} {t === 'anime' ? `(${animeHistory.length})` : t === 'donghua' ? `(${donghuaHistory.length})` : `(${komikHistory.length})`}
              </button>
            ))}
          </div>
        </div>
        {renderEmptyState(normalizedTab)}
      </>
    );
  }

  return (
    <div className="main-container">
      <header className="page-header">
        <h1>Riwayat</h1>
        <p className="subtitle">{tabSubtitles[normalizedTab]}</p>
      </header>

      <div className="filter-tabs" role="radiogroup" aria-label="Filter riwayat">
        {Object.keys(tabLabels).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={normalizedTab === t}
            aria-pressed={normalizedTab === t}
            className={`filter-tab${normalizedTab === t ? ' filter-tab--active active' : ''}`}
            onClick={() => handleTabChange(t)}
          >
            {tabLabels[t]} {t === 'anime' ? `(${animeHistory.length})` : t === 'donghua' ? `(${donghuaHistory.length})` : `(${komikHistory.length})`}
          </button>
        ))}
      </div>

      {normalizedTab === 'anime' ? renderAnimeGrid() : null}
      {normalizedTab === 'donghua' ? renderDonghuaGrid() : null}
      {normalizedTab === 'komik' ? renderKomikGrid() : null}

      <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--sm btn-secondary" onClick={handleClearAnime} style={{ marginRight: 'var(--space-2)' }}>
          <Icon name="close" size={14} /> Hapus Anime
        </button>
        <button type="button" className="btn btn--sm btn-secondary" onClick={handleClearDonghua} style={{ marginRight: 'var(--space-2)' }}>
          <Icon name="close" size={14} /> Hapus Donghua
        </button>
        <button type="button" className="btn btn--sm btn-secondary" onClick={handleClearKomik}>
          <Icon name="close" size={14} /> Hapus Komik
        </button>
        <button type="button" className="btn btn--sm btn-primary" onClick={handleClearAll} style={{ marginLeft: 'var(--space-2)' }}>
          <Icon name="close" size={14} /> Hapus Semua
        </button>
      </div>
    </div>
  );
};

export default WatchHistory;
