import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { animeAPI } from '../services/api';

// Dev-only logger
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
        <div className="error-icon" aria-hidden="true">🔍</div>
        <h2>Donghua Tidak Ditemukan</h2>
        <p className="error-message">{error ?? 'Donghua tidak ditemukan'}</p>
        <p className="error-hint">URL mungkin salah atau konten belum tersedia.</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            ← Kembali
          </button>
          <Link to="/donghua-ongoing" className="btn btn-secondary">Donghua Ongoing</Link>
        </div>
      </div>
    );
  }

  // ── Data extraction ──
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

  const statusColor = status?.toLowerCase().includes('ongoing') ? 'var(--color-success)'
    : status?.toLowerCase().includes('completed') ? 'var(--color-secondary)'
    : 'var(--color-text-muted)';

  devLog('[DonghuaDetail] data:', donghua);

  return (
    <article className="dd main-container" aria-labelledby="dd-title">

      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Beranda</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <Link to="/donghua-ongoing">Donghua</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">{title}</span>
      </nav>

      {/* ── Hero ── */}
      <section className="dd-hero" aria-label="Info donghua">
        {/* Blurred bg */}
        {poster && (
          <div
            className="dd-hero__bg"
            style={{ backgroundImage: `url(${poster})` }}
            aria-hidden="true"
          />
        )}

        <div className="dd-hero__body">
          {/* Poster */}
          <div className="dd-hero__poster-wrap">
            <img
              src={poster}
              alt={`Poster ${title}`}
              className="dd-hero__poster"
              loading="eager"
              onError={(e) => {
                e.target.src = 'https://placehold.co/220x330/16161F/9333EA?text=No+Poster';
              }}
            />
            {status && (
              <span
                className="dd-hero__badge"
                style={{ '--badge-color': statusColor }}
                aria-label={`Status: ${status}`}
              >
                {status}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="dd-hero__info">
            <p className="dd-hero__label">🐉 {type}</p>
            <h1 id="dd-title" className="dd-hero__title">{title}</h1>

            {/* Meta pills */}
            <dl className="dd-meta" aria-label="Detail informasi">
              {rating && (
                <div className="dd-meta__item">
                  <dt className="visually-hidden">Rating</dt>
                  <dd className="dd-meta__pill dd-meta__pill--accent">
                    <span aria-hidden="true">⭐</span> {rating}
                  </dd>
                </div>
              )}
              {epCount && (
                <div className="dd-meta__item">
                  <dt className="visually-hidden">Jumlah episode</dt>
                  <dd className="dd-meta__pill">
                    <span aria-hidden="true">📺</span> {epCount} eps
                  </dd>
                </div>
              )}
              {released && (
                <div className="dd-meta__item">
                  <dt className="visually-hidden">Rilis</dt>
                  <dd className="dd-meta__pill">
                    <span aria-hidden="true">📅</span> {released}
                  </dd>
                </div>
              )}
              {duration && (
                <div className="dd-meta__item">
                  <dt className="visually-hidden">Durasi</dt>
                  <dd className="dd-meta__pill">
                    <span aria-hidden="true">⏱</span> {duration}
                  </dd>
                </div>
              )}
              {studio && (
                <div className="dd-meta__item">
                  <dt className="visually-hidden">Studio</dt>
                  <dd className="dd-meta__pill">
                    <span aria-hidden="true">🏢</span> {studio}
                  </dd>
                </div>
              )}
            </dl>

            {/* Genre tags */}
            {Array.isArray(genres) && genres.length > 0 && (
              <div className="dd-genres" role="list" aria-label="Genre">
                {genres.map((g, i) => {
                  const name = typeof g === 'string' ? g : g.name ?? g.title ?? '';
                  return (
                    <span key={i} className="genre-tag" role="listitem">{name}</span>
                  );
                })}
              </div>
            )}

            {/* CTA buttons */}
            {episodes.length > 0 && (
              <div className="dd-cta" role="group" aria-label="Mulai menonton">
                <Link to={`/watch/${firstSlug}`} className="btn btn-primary btn-large">
                  <span aria-hidden="true">▶</span> Episode 1
                </Link>
                {episodes.length > 1 && (
                  <Link to={`/watch/${latestSlug}`} className="btn btn-secondary btn-large">
                    Episode Terbaru
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Content grid ── */}
      <div className="dd-content">

        {/* Synopsis */}
        <section className="dd-synopsis section section-neo" aria-labelledby="dd-synopsis-heading">
          <h2 id="dd-synopsis-heading" className="dd-section-title">Sinopsis</h2>
          <p className="dd-synopsis__text">{synopsis}</p>
        </section>

        {/* Episode list */}
        {episodes.length > 0 && (
          <section className="dd-episodes section section-neo" aria-labelledby="dd-ep-heading">
            <div className="dd-episodes__header">
              <h2 id="dd-ep-heading" className="dd-section-title">
                Episode
                <span className="dd-episodes__count" aria-label={`${episodes.length} episode`}>
                  {episodes.length}
                </span>
              </h2>
              {episodes.length > 12 && (
                <div className="dd-episodes__search">
                  <label htmlFor="ep-search" className="visually-hidden">Cari episode</label>
                  <input
                    id="ep-search"
                    type="search"
                    className="dd-episodes__search-input"
                    placeholder="Cari episode…"
                    value={epSearch}
                    onChange={e => setEpSearch(e.target.value)}
                    aria-label="Cari episode"
                  />
                </div>
              )}
            </div>

            {filteredEps.length === 0 ? (
              <p className="dd-episodes__empty">Tidak ada episode yang cocok.</p>
            ) : (
              <ol className="dd-ep-grid" aria-label="Daftar episode" reversed>
                {filteredEps.map((ep, idx) => {
                  const epTitle = ep.episode ?? ep.title ?? `Episode ${idx + 1}`;
                  const epSlug  = ep.slug ?? ep.episodeId ?? '';
                  return (
                    <li key={epSlug || idx} className="dd-ep-item">
                      <Link to={`/watch/${epSlug}`} className="dd-ep-btn" aria-label={`Tonton ${epTitle}`}>
                        <span className="dd-ep-btn__title">{epTitle}</span>
                        {ep.date && <span className="dd-ep-btn__date">{ep.date}</span>}
                        <span className="dd-ep-btn__icon" aria-hidden="true">▶</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}

        {episodes.length === 0 && (
          <div className="section section-neo empty-state">
            <p>Episode list tidak tersedia</p>
            <p className="error-hint">Detail lengkap mungkin belum tersedia dari API</p>
          </div>
        )}
      </div>
    </article>
  );
};

export default DonghuaDetail;
