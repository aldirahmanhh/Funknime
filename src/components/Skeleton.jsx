import './Skeleton.css';

const SkeletonAnimeCard = () => {
  return (
    <div className="anime-card">
      <div className="card-image-wrapper">
        <div className="skeleton skeleton-card-poster" />
      </div>
      <div className="skeleton-card-meta">
        <div className="skeleton skeleton-card-title" />
        <div className="skeleton skeleton-card-sub" />
      </div>
    </div>
  );
};

const SkeletonAnimeGrid = ({ count = 6 }) => {
  return (
    <div className="anime-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonAnimeCard key={idx} />
      ))}
    </div>
  );
};

const SkeletonAnimeDetail = () => {
  return (
    <div className="anime-detail">
      <div className="detail-header">
        <div className="skeleton skeleton-detail-poster" />
        <div className="detail-info">
          <div className="skeleton skeleton-detail-title" />
          <div className="skeleton-detail-meta">
            <div className="skeleton skeleton-detail-meta-pill" />
            <div className="skeleton skeleton-detail-meta-pill" />
            <div className="skeleton skeleton-detail-meta-pill" />
          </div>
          <div className="skeleton-detail-meta" style={{ marginTop: 'var(--space-2)' }}>
            <div className="skeleton skeleton-detail-genre" />
            <div className="skeleton skeleton-detail-genre" />
            <div className="skeleton skeleton-detail-genre" />
          </div>
        </div>
      </div>
      <div className="section">
        <div className="skeleton skeleton-text" style={{ height: '18px', width: '80px', marginBottom: 'var(--space-3)' }} />
        <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton skeleton-text" style={{ width: '75%' }} />
      </div>
    </div>
  );
};

const SkeletonWatchPage = () => {
  return (
    <div className="watch-page">
      <div className="skeleton skeleton-watch-title" />
      <div className="skeleton skeleton-watch-player" />
      <div className="server-selector">
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <div className="skeleton skeleton-watch-server" />
          <div className="skeleton skeleton-watch-server" />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="skeleton skeleton-watch-server" />
          <div className="skeleton skeleton-watch-server" />
        </div>
      </div>
      <div className="episode-navigation">
        <div className="skeleton skeleton-watch-nav" />
        <div className="skeleton skeleton-watch-nav" />
      </div>
      <div className="detail-header">
        <div className="skeleton skeleton-info-poster" />
        <div className="detail-info">
          <div className="skeleton skeleton-info-title" />
          <div className="skeleton-detail-meta">
            <div className="skeleton skeleton-info-pill" />
            <div className="skeleton skeleton-info-pill" />
            <div className="skeleton skeleton-info-pill" />
          </div>
        </div>
      </div>
    </div>
  );
};

export {
  SkeletonAnimeCard,
  SkeletonAnimeGrid,
  SkeletonAnimeDetail,
  SkeletonWatchPage
};
