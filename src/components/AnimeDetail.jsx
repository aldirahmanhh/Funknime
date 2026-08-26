import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { animeAPI, APIError } from '../services/api';
import Icon from './Icon';
import './AnimeDetail.css';

const PROVIDER_ORDER = ['otakudesu', 'samehadaku', 'stream'];

const AnimeDetail = () => {
  const { animeId, provider: providerParam } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchUrl, setBatchUrl] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [providerUsed, setProviderUsed] = useState(null);

  useEffect(() => {
    const fetchAnimeData = async () => {
      setLoading(true);
      setError(null);
      setAnime(null);

      const initialProvider = (providerParam || 'otakudesu').toLowerCase();
      const startIndex = PROVIDER_ORDER.indexOf(initialProvider);
      const orderedProviders = startIndex >= 0
        ? [...PROVIDER_ORDER.slice(startIndex), ...PROVIDER_ORDER.slice(0, startIndex)]
        : PROVIDER_ORDER;

      const fetchByProvider = async (prov, id) => {
        if (prov === 'samehadaku') return animeAPI.getAnimeDetailSamehadaku(id);
        if (prov === 'stream') return animeAPI.getAnimeDetailStream(id);
        return animeAPI.getAnimeDetail(id);
      };

      let found = false;
      try {
        for (const prov of orderedProviders) {
          try {
            const data = await fetchByProvider(prov, animeId);
            const payload = data?.data || null;
            if (payload) {
              setAnime({ ...payload, __provider: prov });
              setProviderUsed(prov);
              found = true;
              break;
            }
          } catch (err) {
            if (err instanceof APIError && err.statusCode === 404) continue;
            setError(err?.message ?? String(err));
            break;
          }
        }
        if (!found && !error) { setAnime(null); setError(null); }
      } finally { setLoading(false); }
    };
    fetchAnimeData();
    // Intentionally fetch on slug change only; `error` is read via closure to
    // avoid refetch loops when a provider attempt fails (see loop above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId, providerParam]);

  useEffect(() => {
    if ((providerUsed || (providerParam || 'otakudesu').toLowerCase()) !== 'otakudesu') return;
    const extractBatchUrl = (val) => {
      if (!val) return null;
      if (typeof val === 'string' && val.startsWith('http')) return val;
      if (typeof val === 'object') {
        const u = val.url || val.batchUrl || val.downloadUrl || val.href;
        if (typeof u === 'string' && u.startsWith('http')) return u;
        if (Array.isArray(val)) {
          const first = val[0];
          if (typeof first === 'string') return first;
          if (first?.url) return first.url;
        }
        if (Array.isArray(val.list) && val.list[0]?.url) return val.list[0].url;
      }
      return null;
    };

    if (anime?.batch) {
      const url = extractBatchUrl(anime.batch);
      if (url) { setBatchUrl(url); return; }
    }
    const slugOrId = anime?.slug ?? anime?.animeId ?? animeId;
    if (!slugOrId) return;
    setBatchLoading(true);
    animeAPI.getBatch(slugOrId)
      .then((res) => {
        const url = extractBatchUrl(res?.data) || extractBatchUrl(res);
        if (url) setBatchUrl(url);
      })
      .catch(() => {})
      .finally(() => setBatchLoading(false));
  }, [anime?.slug, anime?.animeId, anime?.batch, animeId, providerUsed, providerParam]);

  if (loading) {
    return (
      <div className="loading-container main-container">
        <div className="spinner" aria-hidden />
        <p>Memuat detail anime...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-container main-container">
        <p className="error-message">Gagal memuat detail anime: {error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Coba Lagi</button>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 8 }}>Kembali ke Beranda</Link>
      </div>
    );
  }
  if (!anime) {
    return (
      <div className="error-container main-container">
        <div className="error-icon"><Icon name="search" size={28} /></div>
        <h2>Anime tidak ditemukan</h2>
        <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
      </div>
    );
  }

  const batchLink = (typeof batchUrl === 'string' && batchUrl.startsWith('http')) ? batchUrl
    : (typeof anime?.batch === 'string' && anime.batch.startsWith('http')) ? anime.batch
    : null;
  const providerLabel = (() => {
    const p = (providerUsed || providerParam || 'otakudesu').toLowerCase();
    if (p === 'samehadaku') return 'Samehadaku';
    if (p === 'stream') return 'Stream';
    return 'Otakudesu';
  })();

  const episodeList = anime.episodeList ?? [];
  const totalEpisodes = anime.episodes ?? anime.episodeCount ?? episodeList.length;
  const getEpisodeNum = (ep) => {
    const num = ep.eps ?? ep.episodeNumber ?? ep.number ?? ep.title;
    const parsed = parseInt(num, 10);
    return isNaN(parsed) ? 999 : parsed;
  };
  const sortedEpisodeList = episodeList.slice().sort((a, b) => getEpisodeNum(a) - getEpisodeNum(b));
  const firstEpisode = sortedEpisodeList.length > 0 ? sortedEpisodeList[0] : null;

  return (
    <div className="anime-detail main-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Beranda</Link>
        <span> / </span>
        <span>{anime.title}</span>
      </nav>

      <div className="detail-header">
        <div className="detail-poster">
          <img
            src={anime.poster ?? anime.poster_url ?? ''}
            alt={anime.title ?? 'Poster'}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300/1a1a26/ff3e9a?text=No+Poster'; }}
          />
        </div>
        <div className="detail-info">
          <h1>{anime.title}</h1>
          <div className="detail-meta">
            <span className="detail-meta-item">{providerLabel}</span>
            {anime.type && <span className="detail-meta-item">{anime.type}</span>}
            {totalEpisodes > 0 && <span className="detail-meta-item">{totalEpisodes} Episode</span>}
            {anime.status && <span className="detail-meta-item">{anime.status}</span>}
            {anime.duration && <span className="detail-meta-item">{anime.duration}</span>}
            {anime.studios && <span className="detail-meta-item">{anime.studios}</span>}
            {anime.aired && <span className="detail-meta-item">{anime.aired}</span>}
          </div>

          {anime.genreList?.length > 0 && (
            <div className="anime-genres">
              {anime.genreList.map((genre, idx) => (
                <Link key={idx} to={`/genres?genre=${genre.genreId}`} className="genre-link">
                  {genre.title}
                </Link>
              ))}
            </div>
          )}

          <div className="anime-actions">
            {firstEpisode?.episodeId && (
              <Link to={`/watch/${firstEpisode.episodeId}`} className="btn btn-primary">
                <Icon name="play" size={16} /> Putar Episode 1
              </Link>
            )}
            {(batchLink || batchLoading) && (
              batchLink ? (
                <a href={batchLink} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                  <Icon name="download" size={16} /> Download Batch
                </a>
              ) : (
                <span className="btn btn-secondary" style={{ opacity: 0.6 }}><Icon name="download" size={16} /> Memuat batch...</span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="anime-synopsis">
        <h2>Sinopsis</h2>
        {anime.synopsis?.paragraphs?.length > 0 ? (
          anime.synopsis.paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Sinopsis tidak tersedia.</p>
        )}
      </div>

      {sortedEpisodeList.length > 0 && (
        <div className="episode-list">
          <div className="episode-list-header">
            Daftar Episode ({sortedEpisodeList.length})
          </div>
          <div className="anime-episode-scroll">
            {sortedEpisodeList.map((episode, idx) => (
              <Link
                key={episode.episodeId ?? idx}
                to={`/watch/${episode.episodeId}`}
                className="episode-item"
                state={{ provider: providerUsed }}
              >
                <span className="episode-title">
                  Episode {episode.eps ?? episode.episodeNumber ?? episode.title ?? idx + 1}
                </span>
                {episode.date && <span className="episode-date">{episode.date}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimeDetail;
