import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { comicAPI } from '../services/api';
import './KomikDetail.css';

/**
 * Route komiku.org image URLs through the server-side proxy to bypass
 * hotlink protection.
 */
const KOMIKU_HOSTS = ['img.komiku.org', 'thumbnail.komiku.org', 'komiku.org'];
const proxyImg = (url) => {
  if (!url) return url;
  if (isDev) return url;
  try {
    const { hostname } = new URL(url);
    if (KOMIKU_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
      return `/api/img-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // not a valid URL — return as-is
  }
  return url;
};

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devLog = (...args) => { if (isDev) console.log(...args); };

const KomikDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chSearch, setChSearch] = useState('');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const ctrl = new AbortController();

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await comicAPI.getComicDetail(slug, { signal: ctrl.signal });
        if (!cancelled) setDetail(res);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          setError(err?.message ?? 'Gagal memuat detail komik');
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
      <div className="kd-loading main-container" role="status" aria-live="polite">
        <div className="kd-loading__inner">
          <div className="kd-loading__poster" aria-hidden="true" />
          <div className="kd-loading__lines" aria-hidden="true">
            <div className="kd-loading__line kd-loading__line--title" />
            <div className="kd-loading__line kd-loading__line--sub" />
            <div className="kd-loading__line kd-loading__line--meta" />
          </div>
        </div>
        <span className="visually-hidden">Memuat detail komik…</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden="true">🔍</div>
        <h2>Komik Tidak Ditemukan</h2>
        <p className="error-message">{error ?? 'Komik tidak ditemukan'}</p>
        <p className="error-hint">URL mungkin salah atau konten belum tersedia.</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            ← Kembali
          </button>
          <Link to="/komik" className="btn btn-secondary">Daftar Komik</Link>
        </div>
      </div>
    );
  }

  // ── Data extraction (defensive — response fields may vary) ──
  const title = detail.title ?? 'Unknown Title';
  const titleId = detail.title_indonesian ?? null;
  const poster = detail.image ?? '';
  const synopsis = detail.synopsis ?? detail.synopsis_full ?? detail.summary ?? 'Sinopsis tidak tersedia.';
  const synopsisFull = detail.synopsis_full ?? null;
  const background = detail.background_story ?? null;

  const meta = detail.metadata ?? {};
  const type = meta.type ?? null;
  const author = meta.author ?? null;
  const status = meta.status ?? null;
  const concept = meta.concept ?? null;
  const ageRating = meta.age_rating ?? null;
  const readingDir = meta.reading_direction ?? null;

  const genres = Array.isArray(detail.genres) ? detail.genres : [];
  const chapters = Array.isArray(detail.chapters) ? detail.chapters : [];

  // Chapters newest-first: last element = Chapter 1, first = latest
  const firstCh = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const latestCh = chapters.length > 0 ? chapters[0] : null;
  const firstSlug = firstCh?.slug ?? '';
  const latestSlug = latestCh?.slug ?? '';

  const filteredChs = chSearch.trim()
    ? chapters.filter(ch => {
        const t = ch.chapter ?? ch.title ?? '';
        return t.toLowerCase().includes(chSearch.toLowerCase());
      })
    : chapters;

  const statusColor = status?.toLowerCase().includes('ongoing') ? 'var(--color-success)'
    : status?.toLowerCase().includes('completed') ? 'var(--color-secondary)'
    : 'var(--color-text-muted)';

  devLog('[KomikDetail] data:', detail);

  return (
    <article className="kd main-container" aria-labelledby="kd-title">

      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Beranda</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <Link to="/komik">Komik</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">{title}</span>
      </nav>

      {/* ── Hero ── */}
      <section className="kd-hero" aria-label="Info komik">
        {poster && (
          <div
            className="kd-hero__bg"
            style={{ backgroundImage: `url(${proxyImg(poster)})` }}
            aria-hidden="true"
          />
        )}

        <div className="kd-hero__body">
          <div className="kd-hero__poster-wrap">
            <img
              src={proxyImg(poster)}
              alt={`Cover ${title}`}
              className="kd-hero__poster"
              loading="eager"
              onError={(e) => {
                e.target.src = 'https://placehold.co/220x330/16161F/9333EA?text=No+Cover';
              }}
            />
            {status && (
              <span
                className="kd-hero__badge"
                style={{ '--badge-color': statusColor }}
                aria-label={`Status: ${status}`}
              >
                {status}
              </span>
            )}
          </div>

          <div className="kd-hero__info">
            <p className="kd-hero__label">📚 {type ?? 'Komik'}</p>
            <h1 id="kd-title" className="kd-hero__title">{title}</h1>
            {titleId && titleId !== title && (
              <p className="kd-hero__alt-title">{titleId}</p>
            )}

            {/* Meta pills */}
            <dl className="kd-meta" aria-label="Detail informasi">
              {author && (
                <div className="kd-meta__item">
                  <dt className="visually-hidden">Author</dt>
                  <dd className="kd-meta__pill">
                    <span aria-hidden="true">✍</span> {author}
                  </dd>
                </div>
              )}
              {concept && (
                <div className="kd-meta__item">
                  <dt className="visually-hidden">Konsep</dt>
                  <dd className="kd-meta__pill">
                    <span aria-hidden="true">🎯</span> {concept}
                  </dd>
                </div>
              )}
              {ageRating && (
                <div className="kd-meta__item">
                  <dt className="visually-hidden">Age rating</dt>
                  <dd className="kd-meta__pill">
                    <span aria-hidden="true">🔞</span> {ageRating}
                  </dd>
                </div>
              )}
              {readingDir && (
                <div className="kd-meta__item">
                  <dt className="visually-hidden">Arah baca</dt>
                  <dd className="kd-meta__pill">
                    <span aria-hidden="true">↔</span> {readingDir}
                  </dd>
                </div>
              )}
              {chapters.length > 0 && (
                <div className="kd-meta__item">
                  <dt className="visually-hidden">Jumlah chapter</dt>
                  <dd className="kd-meta__pill">
                    <span aria-hidden="true">📖</span> {chapters.length} ch
                  </dd>
                </div>
              )}
            </dl>

            {/* Genre tags */}
            {genres.length > 0 && (
              <div className="kd-genres" role="list" aria-label="Genre">
                {genres.map((g, i) => {
                  const name = typeof g === 'string' ? g : g.name ?? g.title ?? '';
                  const gslug = typeof g === 'object' ? (g.slug ?? '') : '';
                  return gslug ? (
                    <Link key={i} to={`/komik-genre/${gslug}`} className="genre-tag" role="listitem">
                      {name}
                    </Link>
                  ) : (
                    <span key={i} className="genre-tag" role="listitem">{name}</span>
                  );
                })}
              </div>
            )}

            {/* CTA buttons */}
            {chapters.length > 0 && (
              <div className="kd-cta" role="group" aria-label="Mulai baca">
                <Link to={`/komik/read/${firstSlug}`} className="btn btn-primary btn-large">
                  <span aria-hidden="true">📖</span> Chapter 1
                </Link>
                {chapters.length > 1 && (
                  <Link to={`/komik/read/${latestSlug}`} className="btn btn-secondary btn-large">
                    Chapter Terbaru
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Content grid ── */}
      <div className="kd-content">

        {/* Synopsis */}
        <section className="kd-synopsis section section-neo" aria-labelledby="kd-synopsis-heading">
          <h2 id="kd-synopsis-heading" className="kd-section-title">Sinopsis</h2>
          <p className="kd-synopsis__text">{synopsis}</p>
          {synopsisFull && synopsisFull !== synopsis && (
            <details className="kd-synopsis__full">
              <summary>Sinopsis lengkap</summary>
              <p>{synopsisFull}</p>
            </details>
          )}
          {background && (
            <p className="kd-synopsis__background">{background}</p>
          )}
        </section>

        {/* Chapter list */}
        {chapters.length > 0 && (
          <section className="kd-chapters section section-neo" aria-labelledby="kd-ch-heading">
            <div className="kd-chapters__header">
              <h2 id="kd-ch-heading" className="kd-section-title">
                Chapter
                <span className="kd-chapters__count" aria-label={`${chapters.length} chapter`}>
                  {chapters.length}
                </span>
              </h2>
              {chapters.length > 12 && (
                <div className="kd-chapters__search">
                  <label htmlFor="ch-search" className="visually-hidden">Cari chapter</label>
                  <input
                    id="ch-search"
                    type="search"
                    className="kd-chapters__search-input"
                    placeholder="Cari chapter…"
                    value={chSearch}
                    onChange={e => setChSearch(e.target.value)}
                    aria-label="Cari chapter"
                  />
                </div>
              )}
            </div>

            {filteredChs.length === 0 ? (
              <p className="kd-chapters__empty">Tidak ada chapter yang cocok.</p>
            ) : (
              <ol className="kd-ch-grid" aria-label="Daftar chapter" reversed>
                {filteredChs.map((ch, idx) => {
                  const chTitle = ch.chapter ?? ch.title ?? `Chapter ${idx + 1}`;
                  const chSlug = ch.slug ?? '';
                  return (
                    <li key={chSlug || idx} className="kd-ch-item">
                      <Link to={`/komik/read/${chSlug}`} className="kd-ch-btn" aria-label={`Baca ${chTitle}`}>
                        <span className="kd-ch-btn__title">{chTitle}</span>
                        {ch.date && <span className="kd-ch-btn__date">{ch.date}</span>}
                        <span className="kd-ch-btn__icon" aria-hidden="true">📖</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}

        {chapters.length === 0 && (
          <div className="section section-neo empty-state">
            <p>Chapter list tidak tersedia</p>
            <p className="error-hint">Detail lengkap mungkin belum tersedia dari API</p>
          </div>
        )}
      </div>
    </article>
  );
};

export default KomikDetail;
