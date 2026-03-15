import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { animeAPI } from '../services/api';

const WatchLoading = () => {
  const { episodeId } = useParams();
  const [episodeData, setEpisodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const data = await animeAPI.getEpisodeDetail(episodeId);
        setEpisodeData(data?.data || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodeData();
  }, [episodeId]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading video...</p>
    </div>
  );

  if (error || !episodeData) return (
    <div className="error-container">
      <p className="error-message">Video not available: {error || 'Episode not found'}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="watch-loading">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
        <div className="episode-info">
          <h2>{episodeData.title}</h2>
          <p>Preparing video player...</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchLoading;