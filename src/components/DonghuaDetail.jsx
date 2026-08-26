import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { animeAPI } from '../services/api';
import Icon from './Icon';
import './DonghuaDetail.css';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devLog = (...args) => { if (isDev) console.log(...args); };

const DonghuaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [donghua, setDonghua] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [epSearch, setEpSearch] = useState('');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const ctrl = new AbortController();

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await animeAPI.getDonghuaDetail(slug, { signal: ctrl.signal });
        if (!cancelled) setDonghua(res?.data ?? res);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          setError(err?.message ?? 'Gagal memuat detail donghua');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => { cancelled = true; ctrl.abort(); };
  }, [slug]);

  if (loading) {
    return (
      <div className="dd-loading main-container" role="status" aria-live="polite">
        <div className="dd-loading__inner">
          <div className="dd-loading__poster" aria-hidden="true" />
          <div className="dd-loading__lines" aria-hidden="true">
            <div className="dd-loading__line dd-loading__line--title" />
            <div className="dd-loading__line dd-loading__line--sub" />
            <div className="dd-loading__line dd-loading__line--meta" />
          </div>
        </div>
        <span className="visually-hidden">Memuat detail donghua…</span>
      </div>
    );
  }

  if (error || !donghua) {
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden="true"><Icon name="search" size={28} /></div>
        <h2>Donghua Tidak Ditemukan</h2>
        <p className="error-message">{error ?? 'Donghua tidak ditemukan'}</p>
        <p className="error-hint">URL mungkin salah atau konten belum tersedia.</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            Kembali
          </button>
          <Link to="/donghua-ongoing" className="btn btn-secondary">Donghua Ongoing</Link>
        </div>
      </div>
    );
  }

  const title       = donghua.title ?? 'Unknown Title';
  const poster      = donghua.poster ?? donghua.poster_url ?? '';
  const synopsis    = donghua.synopsis ?? donghua.description ?? 'Sinopsis tidak tersedia.';
  const status      = donghua.status ?? null;
  const type        = donghua.type ?? 'Donghua';
  const rating      = donghua.rating ?? null;
  const studio      = donghua.studio ?? null;
  const released    = donghua.released ?? donghua.released_on ?? null;
  const duration    = donghua.duration ?? null;
  const epCount     = donghua.episodes_count ?? null;
  const genres      = donghua.genres ?? donghua.genreList ?? [];
  const episodes    = donghua.episodes_list ?? donghua.episodes ?? donghua.episodeList ?? [];

  const firstEp  = episodes.length > 0 ? episodes[episodes.length - 1] : null;
  const latestEp = episodes.length > 0 ? episodes[0] : null;
  const firstSlug  = firstEp?.slug  ?? firstEp?.episodeId  ?? '';
  const latestSlug = latestEp?.slug ?? latestEp?.episodeId ?? '';

  const filteredEps = epSearch.trim()
    ? episodes.filter(ep => {
        const t = ep.episode ?? ep.title ?? '';
        return t.toLowerCase().includes(epSearch.toLowerCase());
      })
    : episodes;

  const isOngoing = status?.toLowerCase().includes('ongoing');

  devLog('[DonghuaDetail] data:', donghua);

  return (
    <article className="dd main-container" aria-labelledby="dd-title">

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Beranda</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <Link to="/donghua-ongoing">Donghua</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">{title}</span>
      </nav>

      <div className="dd-hero-wrap">
        {poster && (
          <div
            className="dd-hero-bg"
            style={{ backgroundImage: `url(${poster})` }}
            aria-hidden="true"
          />
        )}

        <div className="detail-header">
          <div className="detail-poster">
            <img
              src={poster}
              alt={`Poster ${title}`}
              loading="eager"
              onError={(e) => {
                e.target.src = 'https://placehold.co/220x330/16161F/9333EA?text=No+Poster';
              }}
            />
            {status && (
              <span
                className={`dd-status-badge${isOngoing ? ' dd-status-badge--ongoing' : ''}`}
                aria-label={`Status: ${status}`}
              >
                {status}
              </span>
            )}
          </div>

          <div className="detail-info">
            <p className="text-eyebrow">{type}</p>
            <h1 id="dd-title">{title}</h1>

            <div className="detail-meta">
              {rating && (
                <span className="detail-meta-item">
                  <Icon name="star" size={14} /> <span className="num" style={{ color: 'var(--color-accent)' }}>{rating}</span>
                </span>
              )}
              {epCount && (
                <span className="detail-meta-item">
                  <Icon name="monitor" size={14} /> {epCount} eps
                </span>
              )}
              {released && (
                <span className="detail-meta-item">
                  <Icon name="calendar" size={14} /> {released}
                </span>
              )}
              {duration && (
                <span className="detail-meta-item">
                  <Icon name="clock" size={14} /> {duration}
                </span>
              )}
              {studio && (
                <span className="detail-meta-item">
                  {studio}
                </span>
              )}
            </div>

            {Array.isArray(genres) && genres.length > 0 && (
              <div className="dd-genres" role="list" aria-label="Genre">
                {genres.map((g, i) => {
                  const name = typeof g === 'string' ? g : g.name ?? g.title ?? '';
                  return (
                    <span key={i} className="dd-genre-chip" role="listitem">{name}</span>
                  );
                })}
              </div>
            )}

            {episodes.length > 0 && (
              <div className="dd-cta" role="group" aria-label="Mulai menonton">
                <Link to={`/watch/${firstSlug}`} className="btn btn-primary">
                  <Icon name="play" size={16} /> Episode 1
                </Link>
                {episodes.length > 1 && (
                  <Link to={`/watch/${latestSlug}`} className="btn btn-secondary">
                    Episode Terbaru
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="dd-synopsis" aria-labelledby="dd-synopsis-heading">
        <h2 id="dd-synopsis-heading">Sinopsis</h2>
        <p>{synopsis}</p>
      </section>

      {episodes.length > 0 && (
        <section className="episode-list" aria-labelledby="dd-ep-heading">
          <div className="episode-list-header">
            <h2 id="dd-ep-heading" style={{ display: 'inline', fontSize: 'inherit', fontWeight: 'inherit' }}>
              Episode
              <span className="num" style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>
                {episodes.length}
              </span>
            </h2>
            {episodes.length > 12 && (
              <div className="dd-episodes-search">
                <label htmlFor="ep-search" className="visually-hidden">Cari episode</label>
                <input
                  id="ep-search"
                  type="search"
                  placeholder="Cari episode…"
                  value={epSearch}
                  onChange={e => setEpSearch(e.target.value)}
                  aria-label="Cari episode"
                />
              </div>
            )}
          </div>

          {filteredEps.length === 0 ? (
            <p className="dd-episodes-empty">Tidak ada episode yang cocok.</p>
          ) : (
            <div className="dd-episode-scroll">
              {filteredEps.map((ep, idx) => {
                const epTitle = ep.episode ?? ep.title ?? `Episode ${idx + 1}`;
                const epSlug  = ep.slug ?? ep.episodeId ?? '';
                return (
                  <Link
                    key={epSlug || idx}
                    to={`/watch/${epSlug}`}
                    className="episode-item"
                    aria-label={`Tonton ${epTitle}`}
                  >
                    <span className="episode-title">{epTitle}</span>
                    {ep.date && <span className="episode-date">{ep.date}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {episodes.length === 0 && (
        <div className="empty-state">
          <p>Episode list tidak tersedia</p>
          <p className="error-hint">Detail lengkap mungkin belum tersedia dari API</p>
        </div>
      )}
    </article>
  );
};

export default DonghuaDetail;
