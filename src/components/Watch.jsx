import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { animeAPI } from '../services/api';
import { addToWatchHistory, updateWatchProgress, getWatchProgress } from '../utils/watchHistory';
import { addDonghuaHistory, updateDonghuaProgress, getDonghuaProgress } from '../utils/donghuaHistory';
import { isJunkHistoryEntry, isJunkTitle } from '../utils/historyFactory';
import { createPlayer } from '@videojs/react';
import { VideoSkin, Video, videoFeatures } from '@videojs/react/video';
import '@videojs/react/video/skin.css';
import WatchLoading from './WatchLoading';
import EmbedPlayer from './EmbedPlayer';
import Icon from './Icon';

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
const devWarn = (...args) => { if (isDev) console.warn(...args); };
const devLog = (...args) => { if (isDev) console.log(...args); };

const Player = createPlayer({ features: videoFeatures });

// Streaming URLs from the API (desustream, vidhide, filedon, ...) are HTML
// embed pages, NOT direct video files. Feeding them to <video>/Video.js
// always errors. Only .mp4/.m3u8/.webm (or blob:) may use the native player;
// everything else must render as an iframe immediately instead of failing
// through 3 video-error retries first.
const isDirectVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return true;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|m3u8|webm|mkv|ogv|mov)$/.test(clean);
};

// Hosts verified (2026-09-26) to send `frame-ancestors` limited to
// otakudesu/desustream domains, so their embeds can NEVER render inside an
// iframe on our domain. Auto-pick must prefer other servers (vidhide,
// mega, ...) and only fall back to these when nothing else resolves.
const BLOCKED_EMBED_HOSTS = ['desustream.com', 'desustream.net', 'desustream.info', 'desustream.me'];
const isBlockedEmbedUrl = (url) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

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
  const isDonghuaRef = useRef(false);
  const saveTimerRef = useRef(null);

  const saveProgress = useCallback(() => {
    if (!episodeId) return;
    const vid = videoElRef.current;
    if (vid && vid.currentTime > 5) {
      if (isDonghuaRef.current) updateDonghuaProgress(episodeId, vid.currentTime, vid.duration);
      else updateWatchProgress(episodeId, vid.currentTime, vid.duration);
    }
  }, [episodeId]);

  useEffect(() => {
    const onUnload = () => saveProgress();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      saveProgress();
    };
  }, [saveProgress]);

  useEffect(() => {
    let cancelled = false;

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
        } else if (/-subtitle-indonesia$/.test(episodeId || '')) {
          // Donghua-style slug — donghua endpoint first (default order).
          providers = allProviders;
        } else {
          // Anime-style slug (`-sub-indo`) — skip the donghua stub attempt
          // and go straight to anime providers; donghua stays as fallback.
          const donghua = allProviders.find(p => p.name === 'donghua');
          const rest = allProviders.filter(p => p.name !== 'donghua');
          providers = [...rest, donghua];
        }

        let data = null, usedProvider = null, lastError = null;
        for (const p of providers) {
          if (cancelled) return;
          try {
            const result = await p.fn();
            // Donghua endpoint returns a junk stub (empty servers, tutorial
            // title) for non-donghua slugs — `[]` is truthy, so validate it
            // strictly, otherwise every anime episode dies here.
            if (p.name === 'donghua') {
              const dServers = result?.streaming?.servers;
              if (!Array.isArray(dServers) || dServers.length === 0) continue;
              if (isJunkTitle(result?.episode)) continue;
              data = result; usedProvider = p.name; break;
            }
            if (result?.streaming?.servers || result?.data?.defaultStreamingUrl || result?.data?.servers || result?.data?.server) {
              data = result; usedProvider = p.name; break;
            }
          } catch (e) { lastError = e; }
        }
        if (cancelled) return;
        if (!data) throw new Error(lastError?.message || 'Episode tidak ditemukan.');

        if (usedProvider === 'donghua' && data.streaming) {
          if (cancelled) return;
          // (Junk/empty donghua stubs are already rejected in the provider
          // loop above so other providers still get a chance.)
          const dServers = Array.isArray(data.streaming.servers) ? data.streaming.servers : [];
          // Prefer a server whose host allows framing on our domain.
          const dPlayable = dServers.filter((s) => s.url && !isBlockedEmbedUrl(s.url));
          const dPick = dPlayable[0] || dServers[0] || null;
          const dDefaultUrl = dPick?.url || data.streaming.main_url?.url || '';
          if (!dDefaultUrl) {
            throw new Error('Server streaming tidak tersedia untuk episode ini. Coba episode lain.');
          }
          const dd = {
            episode: data.episode,
            defaultStreamingUrl: dDefaultUrl,
            server: { qualities: [{ title: 'Streaming', serverList: dServers.map(s => ({ title: s.name, url: s.url })) }] },
            navigation: data.navigation, donghua_details: data.donghua_details,
          };
          setEpisodeData(dd);
          setVideoUrl(dd.defaultStreamingUrl);
          setSelectedQuality('Streaming');
          if (dPick) setSelectedServer({ title: dPick.name, url: dPick.url });
          else if (dd.server.qualities[0]?.serverList?.[0]) setSelectedServer(dd.server.qualities[0].serverList[0]);
          if (data.donghua_details) {
            const entry = { animeId: data.donghua_details.slug, episodeId, animeTitle: data.donghua_details.title, episodeTitle: data.episode, poster: data.donghua_details.poster, provider: 'donghua' };
            // Never persist scraped non-episode posts (shortlink tutorials, etc.)
            if (!isJunkHistoryEntry(entry)) addDonghuaHistory(entry);
            isDonghuaRef.current = true;
          }
          setLoading(false); return;
        }

        if (cancelled) return;

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
        const quals = normalized?.server?.qualities?.filter(q => q.serverList?.length > 0) || [];
        // Smart initial server: skip empty qualities (e.g. 360p with no
        // servers), resolve candidate URLs in parallel, and prefer a host
        // that allows framing on our domain over the blocked default.
        setSwitching(true);
        setSwitchLabel('Mencari server...');
        let mounted = false;
        if (quals.length > 0) {
          const pick = await pickPlayableServer(quals[0].serverList);
          if (cancelled) return;
          if (pick) {
            setSelectedQuality(quals[0].title);
            setSelectedServer({ ...pick.server, url: pick.url });
            setVideoUrl(pick.url);
            mounted = true;
          }
        }
        if (!mounted && normalized?.defaultStreamingUrl) {
          setSelectedQuality(quals[0]?.title || selectedQuality);
          if (quals[0]?.serverList?.[0]) setSelectedServer(quals[0].serverList[0]);
          setVideoUrl(normalized.defaultStreamingUrl);
        }
        setSwitching(false);
        if (!mounted && !normalized?.defaultStreamingUrl) {
          throw new Error('Server streaming tidak tersedia untuk episode ini. Coba episode lain.');
        }

        if (cancelled) return;

        if (normalized?.animeId) {
          try {
            const animeRes = await animeAPI.getAnimeDetail(normalized.animeId);
            if (cancelled) return;
            setAnimeData(animeRes?.data || null);
            isDonghuaRef.current = false;
            const animeEntry = { animeId: animeRes?.data?.animeId || normalized.animeId, episodeId, animeTitle: animeRes?.data?.title || normalized.title || episodeId, episodeTitle: normalized.title || episodeId, poster: animeRes?.data?.poster || animeRes?.data?.poster_url || '', provider: usedProvider || 'otakudesu' };
            if (!isJunkHistoryEntry(animeEntry)) addToWatchHistory(animeEntry);
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
    // Reload only when the episode changes; nav-state provider is read at
    // mount time intentionally so back/forward navigation doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  const retryCountRef = useRef(0);

  useEffect(() => {
    const vid = videoElRef.current;
    if (!vid) return;
    retryCountRef.current = 0;

    const doSave = (t, d) => {
      if (isDonghuaRef.current) updateDonghuaProgress(episodeId, t, d);
      else updateWatchProgress(episodeId, t, d);
    };
    const savedTime = isDonghuaRef.current ? getDonghuaProgress(episodeId) : getWatchProgress(episodeId);

    const onLoaded = () => {
      if (savedTime > 5) vid.currentTime = savedTime;
      setSwitching(false);
      retryCountRef.current = 0;
    };
    const onPause = () => {
      if (vid.currentTime > 5) doSave(vid.currentTime, vid.duration);
    };
    const onPlay = () => {
      if (!saveTimerRef.current) {
        saveTimerRef.current = setInterval(() => {
          if (vid.currentTime > 5) doSave(vid.currentTime, vid.duration);
        }, 5000);
      }
    };
    const onEnded = () => {
      if (vid.currentTime > 5) doSave(vid.currentTime, vid.duration);
    };

    const onError = () => {
      const lastPos = vid.currentTime || 0;
      devWarn(`[Watch] Video error at ${lastPos}s, retry #${retryCountRef.current + 1}`);

      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        if (lastPos > 5) doSave(lastPos, vid.duration);
        setTimeout(() => {
          try {
            vid.load();
            vid.addEventListener('loadeddata', () => {
              vid.currentTime = Math.max(0, lastPos - 2);
              vid.play().catch(() => {});
            }, { once: true });
          } catch {
            // Ignore video seek errors
          }
        }, 1000);
      } else {
        devWarn('[Watch] Max retries reached, falling back to iframe');
        setVideoFailed(true);
      }
    };

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

  useEffect(() => {
    const adP = ['doubleclick.net', 'googlesyndication.com', 'popads.net', 'popcash.net', 'adsterra.com', 'exoclick.com'];
    const isAd = (h) => h && adP.some(d => h.toLowerCase().includes(d));
    const block = (e) => { const l = e.target.closest('a[target="_blank"]'); if (l && isAd(l.href)) { e.preventDefault(); e.stopPropagation(); } };
    const orig = window.open;
    window.open = function(u) { if (u && isAd(u)) return null; return orig.apply(this, arguments); };
    document.addEventListener('click', block, true);
    return () => { document.removeEventListener('click', block, true); window.open = orig; };
  }, []);

  useEffect(() => {
    if (!switching) return;
    const timer = setTimeout(() => setSwitching(false), 3000);
    return () => clearTimeout(timer);
  }, [videoUrl, switching]);

  // Resolve a server entry to a playable URL (episode payloads only carry
  // serverId/href; the real URL comes from /server/:id).
  const resolveServerUrl = async (server) => {
    if (server?.url) return server.url;
    if (server?.href) {
      const sid = server.serverId || server.href.split('/').pop();
      try {
        const d = await animeAPI.getStreamingServer(sid);
        return d?.data?.url || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Try servers in order; the first URL whose host allows framing on our
  // domain wins. Falls back to the first resolvable URL when all are blocked.
  const pickPlayableServer = async (servers) => {
    const resolved = await Promise.all(
      (servers || []).map(async (s) => ({ server: s, url: await resolveServerUrl(s) }))
    );
    const usable = resolved.filter((r) => r.url);
    return usable.find((r) => !isBlockedEmbedUrl(r.url)) || usable[0] || null;
  };

  const handleServerSelect = (server, siblings = []) => {
    saveProgress();
    setSwitching(true);
    setSwitchLabel(server.title || 'Server');
    setVideoFailed(false);
    setSelectedServer(server);
    const queue = siblings.length > 0 ? siblings : [server];
    const ordered = [server, ...queue.filter((s) => s !== server)];
    pickPlayableServer(ordered).then((pick) => {
      if (pick) {
        setSelectedServer({ ...pick.server, url: pick.url });
        setVideoUrl(pick.url);
      } else if (episodeData?.defaultStreamingUrl) {
        setVideoUrl(episodeData.defaultStreamingUrl);
      }
      setSwitching(false);
    }).catch(() => {
      if (episodeData?.defaultStreamingUrl) setVideoUrl(episodeData.defaultStreamingUrl);
      setSwitching(false);
    });
  };

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    const servers = episodeData?.server?.qualities?.find(q => q.title === quality)?.serverList;
    if (servers?.length > 0) {
      handleServerSelect(servers[0], servers);
    }
  };

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

  const useVideoJs = videoUrl && isDirectVideoUrl(videoUrl) && !videoFailed;
  const useIframe = videoUrl && (!isDirectVideoUrl(videoUrl) || videoFailed);

  if (loading) return <div className="loading-container main-container"><div className="spinner" /><p>Memuat video...</p></div>;

  if (error || !episodeData) {
    const nf = error?.includes('tidak ditemukan') || error?.includes('404');
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden="true">
          <Icon name={nf ? 'search' : 'alert'} size={28} />
        </div>
        <h2>{nf ? 'Episode tidak ditemukan' : 'Terjadi kesalahan'}</h2>
        <p className="error-hint">{error || 'Episode tidak ditemukan'}</p>
        <div className="error-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" size={16} /> Kembali
          </button>
          <Link to="/" className="btn btn-secondary">Ke Beranda</Link>
        </div>
      </div>
    );
  }

  const iframeSrc = useIframe ? toEmbedUrl(videoUrl) : null;
  const backId = animeData?.slug ?? animeData?.animeId ?? animeData?.id ?? episodeData?.animeId ?? episodeData?.animeSlug;
  const hasBack = backId != null && String(backId).trim() !== '';
  const currentServers = episodeData?.server?.qualities?.find(q => q.title === selectedQuality)?.serverList || [];

  // Slow-embed escape hatch: jump to the next server in the current quality.
  const handleTryNextServer = () => {
    if (currentServers.length < 2) return;
    const key = (s) => s?.serverId || s?.title;
    const idx = currentServers.findIndex((s) => key(s) === key(selectedServer));
    const next = currentServers[(idx + 1) % currentServers.length];
    handleServerSelect(next, currentServers);
  };

  return (
    <div className="watch-page main-container">
      <div style={{ marginBottom: 'var(--space-3)' }}>
        {hasBack ? (
          <Link to={`/anime/${backId}`} className="back-link">
            <Icon name="arrow-left" size={16} /> {(animeData?.title || 'Anime').substring(0, 40)}
          </Link>
        ) : (
          <button type="button" className="back-link" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" size={16} /> Kembali
          </button>
        )}
      </div>

      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>{episodeData.title}</h1>

      <div className="video-player-wrapper">
        {switching && <WatchLoading message="Mengganti server..." serverName={switchLabel} />}
        {videoUrl ? (
          useVideoJs ? (
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
            <EmbedPlayer
              key={iframeSrc}
              src={iframeSrc}
              title={episodeData.title}
              onLoad={() => setSwitching(false)}
              onTryNext={currentServers.length > 1 ? handleTryNextServer : undefined}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Buka Video <Icon name="external-link" size={14} /></a>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="spinner" /></div>
        )}
      </div>

      <div className="server-selector">
        {episodeData?.server?.qualities?.length > 0 && (
          <div className="quality-tabs">
            {episodeData.server.qualities.map(q => (
              <button key={q.title} type="button" className={`quality-tab ${selectedQuality === q.title ? 'active' : ''}`} onClick={() => handleQualityChange(q.title)}>{q.title}</button>
            ))}
          </div>
        )}
        <div className="server-list">
          {currentServers.map(s => (
            <button key={s.serverId || s.title} type="button" className={`server-btn ${selectedServer?.title === s.title ? 'active' : ''}`} onClick={() => handleServerSelect(s, currentServers)}>{s.title}</button>
          ))}
        </div>
        <p className="error-hint" style={{ marginTop: 'var(--space-2)' }}>Jika video tidak muncul, coba server atau kualitas lain.</p>
      </div>

      <div className="episode-navigation">
        {(episodeData?.navigation?.previous_episode || (episodeData?.hasPrevEpisode && !episodeData?.navigation)) && (
          <Link to={`/watch/${episodeData?.navigation?.previous_episode?.slug || episodeData?.prevEpisode?.episodeId || episodeId}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
            <Icon name="arrow-left" size={16} /> Eps Sebelumnya
          </Link>
        )}
        {(episodeData?.navigation?.next_episode || (episodeData?.hasNextEpisode && !episodeData?.navigation)) && (
          <Link to={`/watch/${episodeData?.navigation?.next_episode?.slug || episodeData?.nextEpisode?.episodeId || episodeId}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
            Eps Berikutnya <Icon name="arrow-right" size={16} />
          </Link>
        )}
      </div>

      {animeData && (
        <div className="detail-header" style={{ marginTop: 'var(--space-5)' }}>
          <div className="detail-poster" style={{ width: '140px' }}>
            <img src={animeData.poster || animeData.poster_url} alt={animeData.title} loading="lazy" decoding="async" />
          </div>
          <div className="detail-info">
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{animeData.title}</h2>
            <div className="detail-meta">
              {animeData.type && <span className="detail-meta-item"><Icon name="monitor" size={14} /> {animeData.type}</span>}
              {animeData.episodes != null && <span className="detail-meta-item"><Icon name="play" size={14} /> {animeData.episodes} Episode</span>}
              {animeData.status && <span className="detail-meta-item"><Icon name="check" size={14} /> {animeData.status}</span>}
              {animeData.duration && <span className="detail-meta-item"><Icon name="clock" size={14} /> {animeData.duration}</span>}
            </div>
            {animeData.genreList?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
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
