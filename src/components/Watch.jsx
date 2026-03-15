import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { animeAPI } from '../services/api';

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [episodeData, setEpisodeData] = useState(null);
  const [animeData, setAnimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('480p');
  const [selectedServer, setSelectedServer] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [showServerMenu, setShowServerMenu] = useState(false);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        setLoading(true);
        const data = await animeAPI.getEpisodeDetail(episodeId);
        setEpisodeData(data?.data || null);

        // Set default streaming URL
        if (data?.data?.defaultStreamingUrl) {
          setVideoUrl(data.data.defaultStreamingUrl);
        }

        // Also fetch anime details
        if (data?.data?.animeId) {
          try {
            const animeRes = await animeAPI.getAnimeDetail(data.data.animeId);
            setAnimeData(animeRes?.data || null);
          } catch (e) {
            console.log('Could not load anime details');
          }
        }
      } catch (err) {
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodeData();
  }, [episodeId]);

  const handleServerSelect = (server) => {
    console.log('Selected server:', server);
    // If server has an href, fetch it for streaming URL
    if (server.href) {
      const serverId = server.serverId || server.href.split('/').pop();
      console.log('Fetching server URL for ID:', serverId);
      fetchServerUrl(serverId);
    } else if (server.url) {
      console.log('Using direct server URL:', server.url);
      setVideoUrl(server.url);
    }
    setSelectedServer(server);
    setShowServerMenu(false);
  };

  const fetchServerUrl = async (serverId) => {
    try {
      const serverData = await animeAPI.getStreamingServer(serverId);
      if (serverData?.data?.url) {
        setVideoUrl(serverData.data.url);
      }
    } catch (err) {
      console.error('Failed to get server URL:', err);
      // Fallback to default URL from episode data
      if (episodeData?.defaultStreamingUrl) {
        setVideoUrl(episodeData.defaultStreamingUrl);
      }
    }
  };

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    // Find a server for this quality
    const servers = episodeData?.server?.qualities?.find(q => q.title === quality)?.serverList;
    if (servers && servers.length > 0) {
      // Select first available server for this quality
      const defaultServer = servers.find(s => s.title.toLowerCase().includes('ondesu')) || servers[0];
      handleServerSelect(defaultServer);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';

    // Streaming service URLs that work as iframe embeds
    if (
      url.includes('desustream.info') ||
      url.includes('ondesu') ||
      url.includes('odvidhide.com') ||
      url.includes('/embed/') ||
      url.includes('player')
    ) {
      return url; // Use as iframe source directly
    }

    // YouTube -> embed conversion
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Google Drive -> embed conversion
    if (url.includes('drive.google.com')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Direct video files → use <video> tag
    if (url.match(/\.(mp4|webm|ogg|m3u8|mov)$/i)) {
      return null; // Signal to use <video> element
    }

    // Unknown URL - return as-is (could be a direct link)
    return url;
  };

  if (loading) {
    return (
      <div className="loading-container main-container">
        <div className="spinner" aria-hidden />
        <p>Memuat video...</p>
      </div>
    );
  }

  if (error || !episodeData) {
    return (
      <div className="error-container main-container">
        <p className="error-message">Video tidak tersedia: {error || 'Episode tidak ditemukan'}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>Kembali</button>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 8 }}>Ke Beranda</Link>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl);

  const backAnimeId = animeData?.slug ?? animeData?.animeId ?? animeData?.id ?? episodeData?.animeId ?? episodeData?.animeSlug ?? episodeData?.slug;
  const hasValidBackLink = backAnimeId != null && String(backAnimeId).trim() !== '';

  return (
    <div className="watch-page main-container">
      <div className="video-header">
        <div className="anime-context">
          {hasValidBackLink ? (
            <Link to={`/anime/${backAnimeId}`} className="back-link">
              ← Kembali ke {animeData?.title ? (typeof animeData.title === 'string' ? animeData.title.substring(0, 40) : animeData.title) : 'Anime'}
            </Link>
          ) : (
            <button type="button" className="back-link back-link-btn" onClick={() => navigate(-1)}>
              ← Kembali
            </button>
          )}
          <h1>{episodeData.title}</h1>
        </div>
      </div>

      <div className="video-container-wrapper">
        {videoUrl ? (
          <div className="video-wrapper">
            {embedUrl === null ? (
              // Direct video file (mp4, webm, etc.)
              <video
                src={videoUrl}
                className="video-element"
                controls
                autoPlay
                preload="metadata"
                key={videoUrl}
              >
                Your browser does not support the video tag.
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">Download video</a>
              </video>
            ) : embedUrl ? (
              // Embeddable iframe URL
              <iframe
                src={embedUrl}
                className="video-iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={episodeData.title}
                onError={(e) => {
                  console.error('Iframe failed to load:', embedUrl);
                  e.target.style.display = 'none';
                }}
              ></iframe>
            ) : (
              // Unknown URL type - show as download link
              <div className="video-unavailable">
                <p>This video cannot be embedded.</p>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="watch-direct-link">
                  Open video in new tab →
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="no-video">
            <p>Video player is loading...</p>
          </div>
        )}
      </div>

      <div className="video-controls">
        <div className="server-quality-selector">
          <div className="quality-buttons">
            {episodeData?.server?.qualities?.map((q) => (
              <button
                key={q.title}
                className={`quality-btn ${selectedQuality === q.title ? 'active' : ''}`}
                onClick={() => handleQualityChange(q.title)}
              >
                {q.title}
              </button>
            ))}
          </div>

          <div className="server-dropdown-container">
            <button
              type="button"
              className="server-dropdown-btn"
              onClick={() => setShowServerMenu(!showServerMenu)}
              aria-expanded={showServerMenu}
              aria-haspopup="listbox"
            >
              Server: {selectedServer?.title || 'Auto'}
              <span className={`arrow ${showServerMenu ? 'up' : 'down'}`}>▼</span>
            </button>
            {showServerMenu && (
              <div className="server-menu">
                {episodeData?.server?.qualities
                  ?.find(q => q.title === selectedQuality)
                  ?.serverList?.map((server, idx) => (
                    <button
                      key={idx}
                      className={`server-option ${selectedServer?.serverId === server.serverId ? 'active' : ''}`}
                      onClick={() => handleServerSelect(server)}
                    >
                      {server.title}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="video-navigation">
        {episodeData?.hasPrevEpisode && (
          <Link
            to={`/watch/${episodeData.prevEpisode.episodeId}`}
            className="nav-btn prev btn btn-secondary"
          >
            ← Episode Sebelumnya
          </Link>
        )}
        {episodeData?.hasNextEpisode && (
          <Link
            to={`/watch/${episodeData.nextEpisode.episodeId}`}
            className="nav-btn next btn btn-primary"
          >
            Episode Berikutnya →
          </Link>
        )}
      </div>

      <div className="video-info">
        {animeData && (
          <div className="anime-info-card">
            <div className="anime-info-header">
              <img src={animeData.poster} alt={animeData.title} className="info-poster" />
              <div className="anime-info-details">
                <h2>{animeData.title}</h2>
                <div className="info-grid">
                  {animeData.type && <div><strong>Tipe:</strong> {animeData.type}</div>}
                  {animeData.episodes != null && <div><strong>Episode:</strong> {animeData.episodes}</div>}
                  {animeData.status && <div><strong>Status:</strong> {animeData.status}</div>}
                  {animeData.duration && <div><strong>Durasi:</strong> {animeData.duration}</div>}
                </div>
                <div className="genres">
                  {animeData.genreList?.map((g, idx) => (
                    <span key={idx} className="genre-tag">{g.title}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;