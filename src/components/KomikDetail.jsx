import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { comicAPI } from '../services/api';
import Icon from './Icon';
import './KomikDetail.css';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikDetail]', ...args); };

const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};

const extractChapterLabel = (ch) => {
  if (ch.title) return ch.title;
  const m = (ch.slug || '').match(/-chapter-(\d+(?:[.-]\d+)?)$/i);
  return m ? `Chapter ${m[1]}` : ch.slug || 'Chapter ?';
};

const placeholderImg = (text) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">` +
    `<rect width="200" height="280" fill="#181822"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#7E7E9C" font-family="sans-serif" font-size="14" font-weight="bold">` +
    (text || 'Komik').substring(0, 16) +
    `</text></svg>`
  )}`;

const RekomCard = ({ comic }) => {
  const cover = comic.poster ? proxyImage(comic.poster) : placeholderImg(comic.title);
  return (
    <Link to={`/komik/${comic.slug}`} className="kd-rekom-card" title={comic.title}>
      <img src={cover} alt={`${comic.title} poster`} className="kd-rekom-card__img" width={56} height={80} loading="lazy" referrerPolicy="no-referrer"
        onError={(e) => { const f = placeholderImg(comic.title); if (e.target.src !== f) e.target.src = f; }} />
      <div className="kd-rekom-card__info">
        <p className="kd-rekom-card__title">{comic.title}</p>
        <div className="kd-rekom-card__meta">
          {comic.type && <span className="kd-rekom-card__type">{comic.type}</span>}
          {comic.rating && <span className="kd-rekom-card__rating"><Icon name="star" size={12} /> {comic.rating}</span>}
        </div>
      </div>
    </Link>
  );
};

const KomikDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [epSearch, setEpSearch] = useState('');
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [rekomendasi, setRekomendasi] = useState([]);
  const [rekomLoading, setRekomLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const ctrl = new AbortController();
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await comicAPI.getComicDetail(slug, { signal: ctrl.signal });
        if (!cancelled) setDetail(res);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Detail error:', err);
          setError(err?.message ?? 'Gagal memuat detail komik');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
    return () => { cancelled = true; ctrl.abort(); };
  }, [slug]);

  useEffect(() => {
    if (!detail) return;
    let cancelled = false;
    const ctrl = new AbortController();
    setRekomLoading(true);
    (async () => {
      try {
        const res = await comicAPI.getComicRecommendations({ signal: ctrl.signal });
        if (!cancelled) setRekomendasi(res.comics ?? []);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') devWarn('Rekom error:', err);
      } finally {
        if (!cancelled) setRekomLoading(false);
      }
    })();
    return () => { cancelled = true; ctrl.abort(); };
  }, [detail]);

  const [chaptersAsc, setChaptersAsc] = useState(false);
  const sortedChapters = useMemo(() => {
    const list = Array.isArray(detail?.chapters) ? detail.chapters : [];
    return chaptersAsc ? [...list].reverse() : list;
  }, [detail?.chapters, chaptersAsc]);

  const filteredChapters = useMemo(() => {
    if (!epSearch.trim()) return sortedChapters;
    const q = epSearch.trim().toLowerCase();
    return sortedChapters.filter((ch) => {
      const label = extractChapterLabel(ch).toLowerCase();
      return label.includes(q) || (ch.slug || '').toLowerCase().includes(q);
    });
  }, [sortedChapters, epSearch]);

  const handleKeyNav = useCallback((e) => {
    if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      document.querySelector('.kd-chapters__search-input')?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [handleKeyNav]);

  if (loading) {
    return (
      <div className="kd-loading main-container" role="status" aria-live="polite">
        <div className="kd-loading__inner">
          <div className="kd-loading__poster" aria-hidden="true" />
          <div className="kd-loading__lines" aria-hidden="true">
            <div className="kd-loading__line kd-loading__line--title" />
            <div className="kd-loading__line kd-loading__line--sub" />
            <div className="kd-loading__line kd-loading__line--meta" />
            <div className="kd-loading__line" />
          </div>
        </div>
        <span className="visually-hidden">Memuat detail komik…</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden="true">
          <Icon name="alert" size={28} />
        </div>
        <h2 className="kd-error__title">Komik Tidak Ditemukan</h2>
        <p className="error-message">{error ?? 'Komik tidak ditemukan'}</p>
        <p className="error-hint">URL mungkin salah atau konten belum tersedia.</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" size={16} /> Kembali
          </button>
          <Link to="/komik" className="btn btn-secondary">Baca Komik</Link>
        </div>
      </div>
    );
  }

  const title       = detail.title ?? 'Unknown Title';
  const cover       = detail.cover ?? detail.poster ?? '';
  const rating      = detail.rating ?? null;
  const otherTitle  = detail.otherTitle ?? detail.other_title ?? '';
  const status      = detail.status ?? null;
  const type        = detail.type ?? 'Komik';
  const author      = detail.author ?? null;
  const artist      = detail.artist ?? null;
  const release     = detail.release ?? null;
  const synopsis    = detail.synopsis ?? '';
  const series      = detail.series ?? null;
  const reader      = detail.reader ?? null;
  const genres      = Array.isArray(detail.genres) ? detail.genres : [];
  const chapters    = sortedChapters;
  const totalChaps  = chapters.length;

  const firstChapterSlug = chaptersAsc ? chapters[0]?.slug : chapters[chapters.length - 1]?.slug;
  const latestChapterSlug = chaptersAsc ? chapters[chapters.length - 1]?.slug : chapters[0]?.slug;

  const coverUrl = cover ? proxyImage(cover) : '';
  const heroBg = cover ? proxyImage(cover) : '';

  const isLongSynopsis = synopsis && synopsis.length > 300;
  const showFullSynopsis = synopsisExpanded || (synopsis && !isLongSynopsis);

  const filteredRekom = rekomendasi.filter((r) =>
    r.slug !== slug && r.title?.toLowerCase() !== title.toLowerCase()
  );

  return (
    <div className="kd-content main-container">
      <nav className="kd-breadcrumb" aria-label="Breadcrumb">
        <Link to="/komik">Komik</Link>
        <span className="kd-breadcrumb__sep" aria-hidden="true"><Icon name="chevron-right" size={14} /></span>
        <span className="kd-breadcrumb__current">{title}</span>
      </nav>

      <div className="kd-hero">
        {heroBg && <div className="kd-hero__bg" style={{ backgroundImage: `url("${heroBg}")` }} aria-hidden="true" />}
        <div className="kd-hero__gradient" aria-hidden="true" />
        <div className="kd-hero__body">
          <div className="kd-hero__poster-wrap">
            {coverUrl ? (
              <img src={coverUrl} alt={`${title} poster`} className="kd-hero__poster" width={220} height={330}
                referrerPolicy="no-referrer"
                onError={(e) => { const f = placeholderImg(title); if (e.target.src !== f) e.target.src = f; }} />
            ) : (
              <div className="kd-hero__poster kd-hero__poster--empty" aria-hidden="true" />
            )}
            <span className="kd-hero__badge">{type}</span>
            {rating && (
              <span className="kd-hero__rating">
                <Icon name="star" size={14} /> {rating}
              </span>
            )}
          </div>

          <div className="kd-hero__info">
            <div className="kd-hero__meta-row">
              {status && <span className="kd-hero__status chip chip--accent">{status}</span>}
              {totalChaps > 0 && <span className="kd-hero__chap-count num">{totalChaps} Chapter</span>}
            </div>
            <h1 className="kd-hero__title">{title}</h1>
            {otherTitle && <p className="kd-hero__alt-title">{otherTitle}</p>}

            <div className="kd-hero__details">
              {author && <span className="kd-hero__detail"><span className="kd-hero__detail-label">Pengarang</span> {author}</span>}
              {artist && author !== artist && <span className="kd-hero__detail"><span className="kd-hero__detail-label">Ilustrator</span> {artist}</span>}
              {release && <span className="kd-hero__detail"><span className="kd-hero__detail-label">Rilis</span> {release}</span>}
              {reader && <span className="kd-hero__detail"><span className="kd-hero__detail-label">Pembaca</span> {reader}</span>}
              {series && <span className="kd-hero__detail"><span className="kd-hero__detail-label">Serial</span> {series}</span>}
            </div>

            {genres.length > 0 && (
              <div className="kd-genres">
                {genres.map((g) => {
                  const genreSlug = g.slug ?? g.value ?? '';
                  const genreTitle = g.title ?? g.name ?? g;
                  return genreSlug ? (
                    <Link key={genreSlug} to={`/komik/genres?genre=${genreSlug}`} className="chip kd-genre-tag">{genreTitle}</Link>
                  ) : (
                    <span key={genreTitle} className="chip kd-genre-tag">{genreTitle}</span>
                  );
                })}
              </div>
            )}

            <div className="kd-cta">
              {firstChapterSlug && (
                <Link to={`/komik/read/${firstChapterSlug}`} className="btn btn-primary kd-cta__btn">
                  <Icon name="book" size={16} /> Baca dari Awal
                </Link>
              )}
              {latestChapterSlug && latestChapterSlug !== firstChapterSlug && (
                <Link to={`/komik/read/${latestChapterSlug}`} className="btn btn-secondary kd-cta__btn">
                  Baca Terbaru
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {synopsis && (
        <section className="kd-synopsis">
          <h2 className="kd-section-title">Sinopsis</h2>
          <div className={`kd-synopsis__text${!showFullSynopsis ? ' kd-synopsis__text--clamped' : ''}`}>
            {synopsis}
          </div>
          {isLongSynopsis && (
            <button type="button" className="kd-synopsis__toggle" onClick={() => setSynopsisExpanded((v) => !v)}>
              {synopsisExpanded ? <><Icon name="chevron-up" size={16} /> Sembunyikan</> : <><Icon name="chevron-down" size={16} /> Baca Selengkapnya</>}
            </button>
          )}
        </section>
      )}

      <section className="kd-chapters" id="chapters">
        <div className="kd-chapters__topbar">
          <div className="kd-chapters__title-row">
            <h2 className="kd-section-title">Daftar Chapter</h2>
            <span className="kd-chapters__count num">{totalChaps}</span>
          </div>
          <div className="kd-chapters__controls">
            <button type="button" className="kd-chapters__sort-btn" onClick={() => setChaptersAsc((v) => !v)}
              aria-label="Urutkan chapter" aria-pressed={chaptersAsc}>
              <Icon name={chaptersAsc ? 'chevron-up' : 'chevron-down'} size={14} />
              {chaptersAsc ? ' Terlama dulu' : ' Terbaru dulu'}
            </button>
            <div className="kd-chapters__search">
              <input type="search" className="kd-chapters__search-input" placeholder="Cari chapter… (tekan S)"
                value={epSearch} onChange={(e) => setEpSearch(e.target.value)} aria-label="Cari chapter" />
            </div>
          </div>
        </div>

        {filteredChapters.length === 0 ? (
          <p className="kd-chapters__empty">
            {totalChaps === 0 ? 'Belum ada chapter tersedia.' : 'Tidak ada chapter yang cocok.'}
          </p>
        ) : (
          <ul className="kd-ch-grid">
            {filteredChapters.map((ch, idx) => {
              const label = extractChapterLabel(ch);
              const chapNum = (ch.slug || '').match(/-chapter-(\d+(?:[.-]\d+)?)$/i);
              const num = chapNum ? chapNum[1] : null;
              const isNew = idx < 3 && !chaptersAsc;
              return (
                <li key={ch.slug ?? idx} className="kd-ch-item">
                  <Link to={`/komik/read/${ch.slug}`} className="kd-ch-btn">
                    {num && <span className="kd-ch-btn__num num">{num}</span>}
                    <span className="kd-ch-btn__title">{label}</span>
                    {isNew && <span className="kd-ch-btn__new chip chip--accent">baru</span>}
                    {ch.date && <span className="kd-ch-btn__date">{ch.date}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {filteredRekom.length > 0 && (
        <section className="kd-rekom">
          <h2 className="kd-section-title"><Icon name="sparkle" size={20} /> Rekomendasi Lainnya</h2>
          {rekomLoading ? (
            <div className="kd-rekom__loading">Memuat rekomendasi…</div>
          ) : (
            <div className="kd-rekom__grid">
              {filteredRekom.slice(0, 12).map((comic) => (
                <RekomCard key={comic.slug} comic={comic} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default KomikDetail;
