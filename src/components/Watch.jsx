import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { animeAPI } from '../services/api';
import { addToWatchHistory, updateWatchProgress, getWatchProgress } from '../utils/watchHistory';
import { createPlayer } from '@videojs/react';
import { VideoSkin, Video, videoFeatures } from '@videojs/react/video';
import '@videojs/react/video/skin.css';
import WatchLoading from './WatchLoading';
import EmbedPlayer from './EmbedPlayer';

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
const devWarn = (...args) => { if (isDev) console.warn(...args); };
const devLog = (...args) => { if (isDev) console.log(...args); };

const Player = createPlayer({ features: videoFeatures });

const Watch = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [episodeData, setEpisodeData] = useState(null);
  const [animeData, setAnimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('480p');
  const [selectedServer, setSelectedServer] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [switching, setSwitching] = useState(false);
  const [switchLabel, setSwitchLabel] = useState('');
  const [videoFailed, setVideoFailed] = useState(false);
  const videoElRef = useRef(null);
  const saveTimerRef = useRef(null);

  // ─── Progress helpers ───
  const saveProgress = useCallback(() => {
    if (!episodeId) return;
    const vid = videoElRef.current;
    if (vid && vid.currentTime > 5) {
      updateWatchProgress(episodeId, vid.currentTime, vid.duration);
    }
  }, [episodeId]);

  // Save on leave
  useEffect(() => {
    const onUnload = () => saveProgress();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      saveProgress();
    };
  }, [saveProgress]);

  // ─── Fetch episode ───
  useEffect(() => {
    let cancelled = false;

    // Reset ALL state when episodeId changes
    setEpisodeData(null);
    setAnimeData(null);
    setVideoUrl('');
    setError(null);
    setLoading(true);
    setVideoFailed(false);
    setSwitching(false);

    const fetchEpisodeData = async () => {
      try {
        const stateProvider = location.state?.provider;
        const allProviders = [
          { fn: () => animeAPI.getDonghuaEpisode(episodeId), name: 'donghua' },
          { fn: () => animeAPI.getEpisodeDetail(episodeId), name: 'otakudesu' },
          { fn: () => animeAPI.getEpisodeDetailSamehadaku(episodeId), name: 'samehadaku' },
          { fn: () => animeAPI.getEpisodeDetailStream(episodeId), name: 'stream' },
        ];

        let providers;
        if (stateProvider) {
          const primary = allProviders.find(p => p.name === stateProvider);
          const rest = allProviders.filter(p => p.name !== stateProvider);
          providers = primary ? [primary, ...rest] : rest;
        } else {
          providers = allProviders;
        }

        let data = null, usedProvider = null, lastError = null;
        for (const p of providers) {
          if (cancelled) return;
          try {
            const result = await p.fn();
            if (result?.streaming?.servers || result?.data?.defaultStreamingUrl || result?.data?.servers || result?.data?.server) {
              data = result; usedProvider = p.name; break;
            }
          } catch (e) { lastError = e; }
        }
        if (cancelled) return;
        if (!data) throw new Error(lastError?.message || 'Episode tidak ditemukan.');

        // Donghua
        if (usedProvider === 'donghua' && data.streaming) {
          if (cancelled) return;
          const dd = {
            episode: data.episode,
            defaultStreamingUrl: data.streaming.main_url?.url || data.streaming.servers[0]?.url,
            server: { qualities: [{ title: 'Streaming', serverList: data.streaming.servers.map(s => ({ title: s.name, url: s.url })) }] },
            navigation: data.navigation, donghua_details: data.donghua_details,
          };
          setEpisodeData(dd);
          setVideoUrl(dd.defaultStreamingUrl);
          setSelectedQuality('Streaming');
          if (dd.server.qualities[0]?.serverList?.[0]) setSelectedServer(dd.server.qualities[0].serverList[0]);
          if (data.donghua_details) {
            addToWatchHistory({ animeId: data.donghua_details.slug, episodeId, animeTitle: data.donghua_details.title, episodeTitle: data.episode, poster: data.donghua_details.poster, provider: 'donghua' });
          }
          setLoading(false); return;
        }

        if (cancelled) return;

        // Anime
        const raw = data?.data || null;
        let normalized = raw;
        if (raw && !raw.server && Array.isArray(raw.servers)) {
          const qm = new Map();
          raw.servers.forEach(s => {
            const q = s.quality || s.resolution || 'Default';
            if (!qm.has(q)) qm.set(q, []);
            qm.get(q).push({ ...s, title: s.name || s.server || s.title || 'Server' });
          });
          normalized = { ...raw, defaultStreamingUrl: raw.defaultStreamingUrl || raw.servers[0]?.url, server: { qualities: Array.from(qm.entries()).map(([q, sl]) => ({ title: q, serverList: sl })) } };
        }

        setEpisodeData(normalized);
        if (normalized?.defaultStreamingUrl) setVideoUrl(normalized.defaultStreamingUrl);
        if (normalized?.server?.qualities?.length > 0) {
          const fq = normalized.server.qualities[0];
          setSelectedQuality(fq.title);
          if (fq.serverList?.[0]) setSelectedServer(fq.serverList[0]);
        }

        if (cancelled) return;

        if (normalized?.animeId) {
          try {
            const animeRes = await animeAPI.getAnimeDetail(normalized.animeId);
            if (cancelled) return;
            setAnimeData(animeRes?.data || null);
            addToWatchHistory({ animeId: animeRes?.data?.animeId || normalized.animeId, episodeId, animeTitle: animeRes?.data?.title || normalized.title || episodeId, episodeTitle: normalized.title || episodeId, poster: animeRes?.data?.poster || animeRes?.data?.poster_url || '', provider: usedProvider || 'otakudesu' });
          } catch {
            // Ignore history save errors
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEpisodeData();
    return () => { cancelled = true; };
  }, [episodeId]);

  // ─── Video.js progress tracking + error recovery ───
  const retryCountRef = useRef(0);

  useEffect(() => {
    const vid = videoElRef.current;
    if (!vid) return;
    retryCountRef.current = 0;

    const savedTime = getWatchProgress(episodeId);

    const onLoaded = () => {
      if (savedTime > 5) vid.currentTime = savedTime;
      setSwitching(false);
      retryCountRef.current = 0; // reset retry on successful load
    };
    const onPause = () => {
      if (vid.currentTime > 5) updateWatchProgress(episodeId, vid.currentTime, vid.duration);
    };
    const onPlay = () => {
      if (!saveTimerRef.current) {
        saveTimerRef.current = setInterval(() => {
          if (vid.currentTime > 5) updateWatchProgress(episodeId, vid.currentTime, vid.duration);
        }, 5000);
      }
    };
    const onEnded = () => {
      if (vid.currentTime > 5) updateWatchProgress(episodeId, vid.currentTime, vid.duration);
    };

    // Auto-recover from playback errors (FFmpeg demuxer, network stall, etc)
    const onError = () => {
      const lastPos = vid.currentTime || 0;
      devWarn(`[Watch] Video error at ${lastPos}s, retry #${retryCountRef.current + 1}`);

      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        // Save position, reload source, seek back
        if (lastPos > 5) updateWatchProgress(episodeId, lastPos, vid.duration);
        setTimeout(() => {
          try {
            vid.load();
            vid.addEventListener('loadeddata', () => {
              vid.currentTime = Math.max(0, lastPos - 2); // seek back 2s for safety
              vid.play().catch(() => {});
            }, { once: true });
          } catch {
            // Ignore video seek errors
          }
        }, 1000);
      } else {
        // After 3 retries, fallback to iframe
        devWarn('[Watch] Max retries reached, falling back to iframe');
        setVideoFailed(true);
      }
    };

    // Handle stalled/stuck video (no data for 8s)
    let stallTimer = null;
    const onStalled = () => {
      stallTimer = setTimeout(() => {
        if (vid.readyState < 3 && !vid.paused) {
          devWarn('[Watch] Video stalled, attempting recovery');
          const pos = vid.currentTime;
          vid.load();
          vid.addEventListener('loadeddata', () => {
            vid.currentTime = pos;
            vid.play().catch(() => {});
          }, { once: true });
        }
      }, 8000);
    };
    const onPlaying = () => {
      if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
    };

    vid.addEventListener('loadeddata', onLoaded);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('play', onPlay);
    vid.addEventListener('ended', onEnded);
    vid.addEventListener('error', onError);
    vid.addEventListener('stalled', onStalled);
    vid.addEventListener('playing', onPlaying);

    return () => {
      vid.removeEventListener('loadeddata', onLoaded);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('ended', onEnded);
      vid.removeEventListener('error', onError);
      vid.removeEventListener('stalled', onStalled);
      vid.removeEventListener('playing', onPlaying);
      if (saveTimerRef.current) { clearInterval(saveTimerRef.current); saveTimerRef.current = null; }
      if (stallTimer) clearTimeout(stallTimer);
    };
  }, [videoUrl, episodeId]);

  // ─── Auto-rotate on fullscreen (mobile) ───
  useEffect(() => {
    const onFullscreenChange = () => {
      try {
        if (document.fullscreenElement) {
          screen.orientation?.lock?.('landscape').catch(() => {});
        } else {
          screen.orientation?.unlock?.();
        }
      } catch {
        // Ignore orientation lock errors
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      try { screen.orientation?.unlock?.(); } catch { /* ignore */ }
    };
  }, []);

  // ─── Anti-ads ───
  useEffect(() => {
    const adP = ['doubleclick.net', 'googlesyndication.com', 'popads.net', 'popcash.net', 'adsterra.com', 'exoclick.com'];
    const isAd = (h) => h && adP.some(d => h.toLowerCase().includes(d));
    const block = (e) => { const l = e.target.closest('a[target="_blank"]'); if (l && isAd(l.href)) { e.preventDefault(); e.stopPropagation(); } };
    const orig = window.open;
    window.open = function(u) { if (u && isAd(u)) return null; return orig.apply(this, arguments); };
    document.addEventListener('click', block, true);
    return () => { document.removeEventListener('click', block, true); window.open = orig; };
  }, []);

  // Clear switching overlay when video loads
  useEffect(() => {
    if (!switching) return;
    const timer = setTimeout(() => setSwitching(false), 3000); // fallback: auto-hide after 3s
    return () => clearTimeout(timer);
  }, [videoUrl, switching]);

  // ─── Handlers ───
  const handleServerSelect = (server) => {
    saveProgress();
    setSwitching(true);
    setSwitchLabel(server.title || 'Server');
    if (server.href) {
      const sid = server.serverId || server.href.split('/').pop();
      animeAPI.getStreamingServer(sid).then(d => {
        if (d?.data?.url) setVideoUrl(d.data.url);
        else setSwitching(false);
      }).catch(() => {
        if (episodeData?.defaultStreamingUrl) setVideoUrl(episodeData.defaultStreamingUrl);
        setSwitching(false);
      });
    } else if (server.url) {
      setVideoUrl(server.url);
    } else {
      setSwitching(false);
    }
    setVideoFailed(false); // reset fallback on server change
    setSelectedServer(server);
  };

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    setSwitching(true);
    setSwitchLabel(quality);
    const servers = episodeData?.server?.qualities?.find(q => q.title === quality)?.serverList;
    if (servers?.length > 0) {
      handleServerSelect(servers.find(s => s.title?.toLowerCase().includes('ondesu')) || servers[0]);
    } else {
      setSwitching(false);
    }
  };

  // Convert special URLs to embed format for iframe fallback
  const toEmbedUrl = (url) => {
    if (!url) return url;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const v = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${v}`;
    }
    if (url.includes('drive.google.com')) {
      const f = url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${f}/preview`;
    }
    return url;
  };

  // Determine player mode: 'videojs' or 'iframe'
  // Try Video.js first, if it fails (videoFailed=true) → fallback to iframe
  const useVideoJs = videoUrl && !videoFailed;

  // ─── Render ───
  if (loading) return <div className="loading-container main-container"><div className="spinner" /><p>Memuat video...</p></div>;

  if (error || !episodeData) {
    const nf = error?.includes('tidak ditemukan') || error?.includes('404');
    return (
      <div className="error-container main-container">
        <div className="error-icon">{nf ? '🔍' : '⚠️'}</div>
        <h2>{nf ? 'Episode Tidak Ditemukan' : 'Terjadi Kesalahan'}</h2>
        <p className="error-message">{error || 'Episode tidak ditemukan'}</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>← Kembali</button>
          <Link to="/" className="btn btn-secondary">Ke Beranda</Link>
        </div>
      </div>
    );
  }

  const iframeSrc = videoFailed ? toEmbedUrl(videoUrl) : null;
  const backId = animeData?.slug ?? animeData?.animeId ?? animeData?.id ?? episodeData?.animeId ?? episodeData?.animeSlug;
  const hasBack = backId != null && String(backId).trim() !== '';

  return (
    <div className="watch-page main-container">
      <div style={{ marginBottom: '12px' }}>
        {hasBack ? (
          <Link to={`/anime/${backId}`} className="back-link">← Kembali ke {(animeData?.title || 'Anime').substring(0, 40)}</Link>
        ) : (
          <button type="button" className="back-link" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--text-sm)', padding: 0, fontFamily: 'var(--font-sans)' }}>← Kembali</button>
        )}
      </div>

      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: '16px' }}>{episodeData.title}</h1>

      {/* Video Player */}
      <div className="video-player-wrapper" style={{ position: 'relative' }}>
        {switching && <WatchLoading message="Mengganti server..." serverName={switchLabel} />}
        {videoUrl ? (
          useVideoJs ? (
            /* Try Video.js first */
            <Player.Provider key={videoUrl}>
              <VideoSkin>
                <Video
                  ref={(el) => {
                    videoElRef.current = el;
                    if (el) {
                      el.onerror = () => {
                        devLog('[Watch] Video.js failed, falling back to iframe');
                        setVideoFailed(true);
                        setSwitching(false);
                      };
                    }
                  }}
                  src={videoUrl}
                  playsInline
                  autoPlay
                />
              </VideoSkin>
            </Player.Provider>
          ) : iframeSrc ? (
            /* Fallback: enhanced embed player */
            <EmbedPlayer src={iframeSrc} title={episodeData.title} onLoad={() => setSwitching(false)} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Buka Video →</a>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="spinner" /></div>
        )}
      </div>

      {/* Quality & Server */}
      <div className="server-selector">
        {episodeData?.server?.qualities?.length > 0 && (
          <div className="quality-tabs">
            {episodeData.server.qualities.map(q => (
              <button key={q.title} type="button" className={`quality-tab ${selectedQuality === q.title ? 'active' : ''}`} onClick={() => handleQualityChange(q.title)}>{q.title}</button>
            ))}
          </div>
        )}
        <div className="server-list">
          {episodeData?.server?.qualities?.find(q => q.title === selectedQuality)?.serverList?.map(s => (
            <button key={s.serverId || s.title} type="button" className={`server-btn ${selectedServer?.title === s.title ? 'active' : ''}`} onClick={() => handleServerSelect(s)}>{s.title}</button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="episode-navigation">
        {(episodeData?.navigation?.previous_episode || (episodeData?.hasPrevEpisode && !episodeData?.navigation)) && (
          <Link to={`/watch/${episodeData?.navigation?.previous_episode?.slug || episodeData?.prevEpisode?.episodeId || episodeId}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>← Eps Sebelumnya</Link>
        )}
        {(episodeData?.navigation?.next_episode || (episodeData?.hasNextEpisode && !episodeData?.navigation)) && (
          <Link to={`/watch/${episodeData?.navigation?.next_episode?.slug || episodeData?.nextEpisode?.episodeId || episodeId}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>Eps Berikutnya →</Link>
        )}
      </div>

      {/* Anime Info */}
      {animeData && (
        <div className="detail-header" style={{ marginTop: '20px' }}>
          <div className="detail-poster" style={{ width: '140px' }}>
            <img src={animeData.poster || animeData.poster_url} alt={animeData.title} loading="lazy" decoding="async" />
          </div>
          <div className="detail-info">
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>{animeData.title}</h2>
            <div className="detail-meta">
              {animeData.type && <span className="detail-meta-item">📺 {animeData.type}</span>}
              {animeData.episodes != null && <span className="detail-meta-item">🎬 {animeData.episodes} Episode</span>}
              {animeData.status && <span className="detail-meta-item">📊 {animeData.status}</span>}
              {animeData.duration && <span className="detail-meta-item">⏱️ {animeData.duration}</span>}
            </div>
            {animeData.genreList?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {animeData.genreList.map(g => <span key={g.title} className="detail-meta-item" style={{ fontSize: '0.65rem' }}>{g.title}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
