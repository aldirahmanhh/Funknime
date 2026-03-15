import { useState, useEffect } from 'react';

const SkeletonAnimeCard = () => {
  return (
    <div className="anime-card skeleton">
      <div className="card-image-wrapper">
        <div className="poster skeleton skeleton-anime-card"></div>
        <div className="card-overlay">
          <span className="play-icon skeleton skeleton-text">▶</span>
        </div>
      </div>
      <div className="anime-info">
        <div className="skeleton-text" style={{ width: '60%' }}></div>
        <div className="meta">
          <div className="skeleton-text" style={{ width: '40%' }}></div>
          <div className="skeleton-text" style={{ width: '30%' }}></div>
        </div>
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
      <div className="anime-header">
        <div className="poster skeleton skeleton-anime-card" style={{ width: '250px', height: '350px' }}></div>
        <div className="anime-info">
          <div className="skeleton-text" style={{ height: '32px', width: '60%' }}></div>
          <div className="info-grid">
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
          </div>
          <div className="genres">
            <div className="skeleton-text" style={{ height: '16px', width: '30%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '30%' }}></div>
            <div className="skeleton-text" style={{ height: '16px', width: '30%' }}></div>
          </div>
        </div>
      </div>
      <div className="anime-content">
        <section className="synopsis">
          <h2 className="skeleton-text" style={{ height: '24px', width: '80px' }}></h2>
          <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
          <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
          <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
        </section>
        <section className="episodes-section">
          <h2 className="skeleton-text" style={{ height: '24px', width: '120px' }}></h2>
          <div className="episodes-grid">
            <div className="episode-card skeleton">
              <div className="episode-info">
                <span className="skeleton-text" style={{ height: '16px', width: '80px' }}></span>
                <span className="skeleton-text" style={{ height: '12px', width: '60px' }}></span>
              </div>
              <div className="episode-actions">
                <button className="skeleton skeleton-text" style={{ height: '28px', width: '60px' }}></button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const SkeletonWatchPage = () => {
  return (
    <div className="watch-page">
      <div className="video-header">
        <div className="anime-context">
          <div className="skeleton-text" style={{ height: '20px', width: '120px' }}></div>
          <h1 className="skeleton-text" style={{ height: '28px', width: '200px' }}></h1>
        </div>
      </div>
      
      <div className="video-container-wrapper">
        <div className="video-wrapper">
          <div className="video-element skeleton" style={{ height: '400px' }}></div>
        </div>
      </div>

      <div className="video-controls">
        <div className="server-quality-selector">
          <div className="quality-buttons">
            <div className="skeleton skeleton-text" style={{ height: '32px', width: '60px' }}></div>
            <div className="skeleton skeleton-text" style={{ height: '32px', width: '60px' }}></div>
            <div className="skeleton skeleton-text" style={{ height: '32px', width: '60px' }}></div>
          </div>
          
          <div className="server-dropdown-container">
            <button className="server-dropdown-btn">
              <span className="skeleton skeleton-text" style={{ height: '20px', width: '80px' }}></span>
              <span className="arrow skeleton skeleton-text" style={{ height: '16px', width: '16px' }}></span>
            </button>
            <div className="server-menu">
              <button className="skeleton skeleton-text" style={{ height: '28px', width: '120px' }}></button>
              <button className="skeleton skeleton-text" style={{ height: '28px', width: '120px' }}></button>
              <button className="skeleton skeleton-text" style={{ height: '28px', width: '120px' }}></button>
            </div>
          </div>
        </div>
      </div>

      <div className="video-navigation">
        <button className="nav-btn skeleton skeleton-text" style={{ height: '40px', width: '120px' }}></button>
        <button className="nav-btn skeleton skeleton-text" style={{ height: '40px', width: '120px' }}></button>
      </div>

      <div className="video-info">
        <div className="anime-info-card">
          <div className="anime-info-header">
            <div className="info-poster skeleton skeleton-anime-card" style={{ width: '150px', height: '200px' }}></div>
            <div className="anime-info-details">
              <div className="skeleton-text" style={{ height: '24px', width: '100%' }}></div>
              <div className="info-grid">
                <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
                <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
                <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
                <div className="skeleton-text" style={{ height: '16px', width: '100%' }}></div>
              </div>
              <div className="genres">
                <div className="skeleton-text" style={{ height: '16px', width: '40%' }}></div>
                <div className="skeleton-text" style={{ height: '16px', width: '40%' }}></div>
                <div className="skeleton-text" style={{ height: '16px', width: '40%' }}></div>
              </div>
            </div>
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