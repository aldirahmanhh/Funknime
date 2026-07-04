import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { comicAPI } from '../services/api';

// Dev-only logger
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikDetail]', ...args); };

// Route images through the serverless img-proxy to bypass hotlink protection.
// In dev, load directly (no Vercel Referrer-Policy override).
const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};

// Extract chapter number from slug like "{title}-chapter-{N}"
const extractChapterLabel = (ch) => {
  if (ch.title) return ch.title;
  const m = (ch.slug || '').match(/-chapter-(\d+(?:[.-]\d+)?)$/i);
  return m ? `Chapter ${m[1]}` : ch.slug || 'Chapter ?';
};

// Inline SVG placeholder
const placeholderImg = (text) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">` +
    `<rect width="200" height="280" fill="#1a1a26"/>` +
    `<text x="100" y="140" text-anchor="middle" fill="#9333EA" font-family="sans-serif" font-size="14" font-weight="bold">` +
    (text || 'Komik').substring(0, 16) +
    `</text></svg>`
  )}`;

// Compact card for recommendations sidebar
const RekomCard = ({ comic }) => {
  const cover = comic.poster
    ? proxyImage(comic.poster)
    : placeholderImg(comic.title);
  return (
    <Link to={`/komik/${comic.slug}`} className="kd-rekom-card" title={comic.title}>
      <img
        src={cover}
        alt={comic.title}
        className="kd-rekom-card__img"
        width={60}
        height={85}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(e) => { const f = placeholderImg(comic.title); if (e.target.src !== f) e.target.src = f; }}
      />
      <div className="kd-rekom-card__info">
        <p className="kd-rekom-card__title">{comic.title}</p>
        {comic.rating && <span className="kd-rekom-card__rating">⭐ {comic.rating}</span>}
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

  // Load recommendations when detail is ready
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
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Rekom error:', err);
        }
      } finally {
        if (!cancelled) setRekomLoading(false);
      }
    })();
    return () => { cancelled = true; ctrl.abort(); };
  }, [detail]);

  // chapters are newest-first (Ch.N first, Ch.1 last) per bacakomik docs.
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

  // Keyboard shortcut: press 's' to focus chapter search
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
          <Link to="/komik" className="btn btn-secondary">Baca Komik</Link>
        </div>
      </div>
    );
  }

  // ── Data extraction ──
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

  const firstChapterSlug = chaptersAsc
    ? chapters[0]?.slug
    : chapters[chapters.length - 1]?.slug;
  const latestChapterSlug = chaptersAsc
    ? chapters[chapters.length - 1]?.slug
    : chapters[0]?.slug;

  const coverUrl = cover ? proxyImage(cover) : '';
  const heroBg = cover ? proxyImage(cover) : '';

  // Synopsis: auto-expand if short (< 300 chars)
  const isLongSynopsis = synopsis && synopsis.length > 300;
  const showFullSynopsis = synopsisExpanded || (synopsis && !isLongSynopsis);

  // Dedupe recommendations against current title
  const filteredRekom = rekomendasi.filter((r) =>
    r.slug !== slug && r.title?.toLowerCase() !== title.toLowerCase()
  );

  return (
    <div className="kd-content main-container">
      {/* Hero */}
      <div className="kd-hero">
        {heroBg && <div className="kd-hero__bg" style={{ backgroundImage: `url("${heroBg}")` }} aria-hidden="true" />}
        <div className="kd-hero__body">
          <div className="kd-hero__poster-wrap">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                className="kd-hero__poster"
                width={200}
                height={300}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const f = placeholderImg(title);
                  if (e.target.src !== f) e.target.src = f;
                }}
              />
            ) : (
              <div className="kd-hero__poster kd-hero__poster--empty" aria-hidden="true" />
            )}
            {type && <span className="kd-hero__badge">{type}</span>}
          </div>

          <div className="kd-hero__info">
            {type && <p className="kd-hero__label">{type}</p>}
            <h1 className="kd-hero__title">{title}</h1>
            {otherTitle && <p className="kd-hero__alt-title">{otherTitle}</p>}

            {/* Meta pills */}
            <div className="kd-meta">
              {status && (
                <span className="kd-meta__pill kd-meta__pill--accent">{status}</span>
              )}
              {rating && (
                <span className="kd-meta__pill">⭐ {rating}</span>
              )}
              {totalChaps > 0 && (
                <span className="kd-meta__pill">📖 {totalChaps} Chapter</span>
              )}
              {reader && (
                <span className="kd-meta__pill">👁️ {reader}</span>
              )}
              {author && (
                <span className="kd-meta__pill">✍️ {author}</span>
              )}
              {artist && author !== artist && (
                <span className="kd-meta__pill">🎨 {artist}</span>
              )}
              {release && (
                <span className="kd-meta__pill">📅 {release}</span>
              )}
            </div>

            {/* Extra info row */}
            {series && (
              <p className="kd-hero__series">Serial: {series}</p>
            )}

            {/* Genres — clickable */}
            {genres.length > 0 && (
              <div className="kd-genres">
                {genres.map((g) => {
                  const genreSlug = g.slug ?? g.value ?? '';
                  const genreTitle = g.title ?? g.name ?? g;
                  return genreSlug ? (
                    <Link
                      key={genreSlug}
                      to={`/komik/genres?genre=${genreSlug}`}
                      className="genre-tag kd-genres__tag"
                    >
                      {genreTitle}
                    </Link>
                  ) : (
                    <span key={genreTitle} className="genre-tag kd-genres__tag">
                      {genreTitle}
                    </span>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="kd-cta">
              {firstChapterSlug && (
                <Link to={`/komik/read/${firstChapterSlug}`} className="btn btn-primary">
                  📖 Baca dari Awal
                </Link>
              )}
              {latestChapterSlug && latestChapterSlug !== firstChapterSlug && (
                <Link to={`/komik/read/${latestChapterSlug}`} className="btn btn-secondary">
                  Baca Chapter Terbaru
                </Link>
              )}
              <Link to="/komik" className="btn btn-ghost">← Kembali</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis */}
      {synopsis && (
        <section className="kd-synopsis">
          <h2 className="kd-section-title">Sinopsis</h2>
          <div className={`kd-synopsis__text${!showFullSynopsis ? ' kd-synopsis__text--clamped' : ''}`}>
            {synopsis}
          </div>
          {isLongSynopsis && (
            <button
              type="button"
              className="kd-synopsis__toggle"
              onClick={() => setSynopsisExpanded((v) => !v)}
            >
              {synopsisExpanded ? '▲ Sembunyikan' : '▼ Baca Selengkapnya'}
            </button>
          )}
        </section>
      )}

      {/* Chapter list */}
      <section className="kd-chapters" id="chapters">
        <div className="kd-chapters__header">
          <h2 className="kd-section-title">
            Daftar Chapter
            <span className="kd-chapters__count">{totalChaps}</span>
          </h2>
          <div className="kd-chapters__controls">
            <button
              type="button"
              className="btn btn-ghost kd-chapters__sort-btn"
              onClick={() => setChaptersAsc((v) => !v)}
              aria-label="Urutkan chapter"
              aria-pressed={chaptersAsc}
            >
              {chaptersAsc ? '↑ Terlama' : '↓ Terbaru'}
            </button>
            <div className="kd-chapters__search">
              <input
                type="search"
                className="kd-chapters__search-input"
                placeholder="Cari chapter… (tekan S)"
                value={epSearch}
                onChange={(e) => setEpSearch(e.target.value)}
                aria-label="Cari chapter"
              />
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
              const isNew = idx < 3 && !chaptersAsc; // newest 3 chapters
              return (
                <li key={ch.slug ?? idx} className="kd-ch-item">
                  <Link to={`/komik/read/${ch.slug}`} className="kd-ch-btn">
                    {isNew && <span className="kd-ch-btn__new" aria-label="Baru">NEW</span>}
                    <span className="kd-ch-btn__title">{label}</span>
                    {ch.date && <span className="kd-ch-btn__date">{ch.date}</span>}
                    <span className="kd-ch-btn__icon" aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recommendations */}
      {filteredRekom.length > 0 && (
        <section className="kd-rekom">
          <h2 className="kd-section-title">🎯 Rekomendasi</h2>
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
