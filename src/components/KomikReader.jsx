import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { comicAPI } from '../services/api';
import './KomikReader.css';

// Dev-only logger
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikReader]', ...args); };

// Route chapter images through the serverless img-proxy to bypass hotlink
// protection. Chapter images come from CDN domains like
// imageainewgeneration.lol, himmga.lat, gaimgame.pics.
// In dev, load directly (no Vercel Referrer-Policy override).
const proxyImage = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/img-proxy') || url.startsWith('data:')) return url;
  if (isDev) return url;
  return `/api/img-proxy?url=${encodeURIComponent(url)}`;
};

const KomikReader = () => {
  const { chapterSlug } = useParams();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('vertical'); // 'vertical' | 'horizontal'
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!chapterSlug) return;
    let cancelled = false;
    const ctrl = new AbortController();

    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setCurrentImage(0);
      try {
        const res = await comicAPI.getComicChapter(chapterSlug, { signal: ctrl.signal });
        if (!cancelled) setChapter(res);
      } catch (err) {
        if (!cancelled && err?.name !== 'AbortError') {
          devWarn('Chapter error:', err);
          setError(err?.message ?? 'Gagal memuat chapter');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchChapter();
    window.scrollTo(0, 0);
    return () => { cancelled = true; ctrl.abort(); };
  }, [chapterSlug]);

  const images = Array.isArray(chapter?.images) ? chapter.images : [];
  const nav = chapter?.navigation ?? {};
  const prevSlug = nav.prev ?? null;
  const nextSlug = nav.next ?? null;

  const goPrev = useCallback(() => {
    if (prevSlug) navigate(`/komik/read/${prevSlug}`);
  }, [prevSlug, navigate]);

  const goNext = useCallback(() => {
    if (nextSlug) navigate(`/komik/read/${nextSlug}`);
  }, [nextSlug, navigate]);

  // Keyboard navigation (horizontal mode)
  useEffect(() => {
    if (mode !== 'horizontal') return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        if (currentImage > 0) setCurrentImage((i) => i - 1);
        else goPrev();
      } else if (e.key === 'ArrowRight') {
        if (currentImage < images.length - 1) setCurrentImage((i) => i + 1);
        else goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, currentImage, images.length, goPrev, goNext]);

  if (loading) {
    return (
      <div className="kr-loading main-container" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Memuat chapter...</p>
      </div>
    );
  }

  if (error || !chapter || images.length === 0) {
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden="true">📖</div>
        <h2>Chapter Tidak Ditemukan</h2>
        <p className="error-message">{error ?? 'Chapter tidak ditemukan atau tidak memiliki gambar.'}</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            ← Kembali
          </button>
          <Link to="/komik" className="btn btn-secondary">Baca Komik</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kr main-container">
      {/* Top bar */}
      <div className="kr-topbar">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/komik">Komik</Link>
          {' / '}
          <span>{chapter.title || chapterSlug}</span>
        </nav>
        <div className="kr-title">
          <span className="kr-title__chapter">{chapter.title || 'Chapter'}</span>
        </div>
        <div className="kr-controls">
          <button
            type="button"
            className={`btn btn-ghost kr-mode-btn ${mode === 'vertical' ? 'active' : ''}`}
            onClick={() => setMode('vertical')}
            aria-pressed={mode === 'vertical'}
          >
            ↕ Vertikal
          </button>
          <button
            type="button"
            className={`btn btn-ghost kr-mode-btn ${mode === 'horizontal' ? 'active' : ''}`}
            onClick={() => setMode('horizontal')}
            aria-pressed={mode === 'horizontal'}
          >
            ↔ Horizontal
          </button>
        </div>
      </div>

      {/* Images */}
      {mode === 'vertical' ? (
        <div className="kr-images--vertical">
          {images.map((src, idx) => (
            <img
              key={idx}
              src={proxyImage(src)}
              alt={`Halaman ${idx + 1}`}
              className="kr-page"
              loading={idx < 2 ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                devWarn('Image load failed:', src);
                e.target.style.opacity = '0.3';
              }}
            />
          ))}
        </div>
      ) : (
        <div className="kr-horizontal">
          <div className="kr-horizontal__page">
            <button
              type="button"
              className="kr-horizontal__nav kr-horizontal__nav--prev"
              onClick={() => (currentImage > 0 ? setCurrentImage((i) => i - 1) : goPrev())}
              disabled={currentImage === 0 && !prevSlug}
              aria-label="Halaman sebelumnya"
            >
              ‹
            </button>
            <img
              src={proxyImage(images[currentImage])}
              alt={`Halaman ${currentImage + 1}`}
              className="kr-page kr-page--single"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.opacity = '0.3'; }}
            />
            <button
              type="button"
              className="kr-horizontal__nav kr-horizontal__nav--next"
              onClick={() => (currentImage < images.length - 1 ? setCurrentImage((i) => i + 1) : goNext())}
              disabled={currentImage === images.length - 1 && !nextSlug}
              aria-label="Halaman berikutnya"
            >
              ›
            </button>
          </div>
          <span className="kr-horizontal__counter">
            {currentImage + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Bottom navigation */}
      <nav className="kr-nav" aria-label="Navigasi chapter">
        <button
          type="button"
          className="btn btn-secondary kr-nav__btn"
          onClick={goPrev}
          disabled={!prevSlug}
        >
          ← Chapter Sebelumnya
        </button>
        <Link to="/komik" className="btn btn-ghost kr-nav__btn">
          📚 Daftar Komik
        </Link>
        <button
          type="button"
          className="btn btn-primary kr-nav__btn"
          onClick={goNext}
          disabled={!nextSlug}
        >
          Chapter Berikutnya →
        </button>
      </nav>
      <p className="kr-nav__hint">
        {prevSlug ? 'Ada chapter sebelumnya' : 'Ini adalah chapter pertama'}
        {' • '}
        {nextSlug ? 'Ada chapter berikutnya' : 'Ini adalah chapter terakhir'}
      </p>
    </div>
  );
};

export default KomikReader;
