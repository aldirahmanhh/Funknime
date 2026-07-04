import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { comicAPI } from '../services/api';
import './KomikReader.css';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const devWarn = (...args) => { if (isDev) console.warn('[KomikReader]', ...args); };

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
  const [mode, setMode] = useState('vertical');
  const [currentImage, setCurrentImage] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());

  useEffect(() => {
    if (!chapterSlug) return;
    let cancelled = false;
    const ctrl = new AbortController();

    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setCurrentImage(0);
      setLoadedImages(new Set());
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

  const goPrev = useCallback(() => { if (prevSlug) navigate(`/komik/read/${prevSlug}`); }, [prevSlug, navigate]);
  const goNext = useCallback(() => { if (nextSlug) navigate(`/komik/read/${nextSlug}`); }, [nextSlug, navigate]);

  const onImageLoad = (idx) => setLoadedImages((s) => new Set(s).add(idx));

  // Keyboard navigation
  useEffect(() => {
    if (mode !== 'horizontal') return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (currentImage > 0) setCurrentImage((i) => i - 1);
        else goPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
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
        <div className="kr-loading__spinner" aria-hidden="true" />
        <p className="kr-loading__text">Memuat chapter…</p>
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
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>← Kembali</button>
          <Link to="/komik" className="btn btn-secondary">Baca Komik</Link>
        </div>
      </div>
    );
  }

  // Extract chapter number from slug
  const chapMatch = (chapterSlug || '').match(/-chapter-(\d+(?:[.-]\d+)?)$/i);
  const chapNum = chapMatch ? chapMatch[1] : '?';

  return (
    <div className="kr">
      {/* Topbar */}
      <header className="kr-topbar">
        <nav className="kr-topbar__breadcrumb" aria-label="Breadcrumb">
          <Link to="/komik">Komik</Link>
          <span aria-hidden="true"> › </span>
          <span className="kr-topbar__current">{chapter.title || chapterSlug}</span>
        </nav>
        <div className="kr-topbar__info">
          <h1 className="kr-topbar__title">Chapter {chapNum}</h1>
          <div className="kr-topbar__controls">
            <div className="kr-mode-toggle" role="radiogroup" aria-label="Mode baca">
              <button type="button" className={`kr-mode-btn${mode === 'vertical' ? ' kr-mode-btn--active' : ''}`}
                onClick={() => setMode('vertical')} role="radio" aria-checked={mode === 'vertical'}>
                ↕ Gulir
              </button>
              <button type="button" className={`kr-mode-btn${mode === 'horizontal' ? ' kr-mode-btn--active' : ''}`}
                onClick={() => setMode('horizontal')} role="radio" aria-checked={mode === 'horizontal'}>
                ↔ Halaman
              </button>
            </div>
          </div>
        </div>
        {/* Page counter in horizontal mode */}
        {mode === 'horizontal' && (
          <div className="kr-topbar__progress">
            <div className="kr-progress-bar">
              <div className="kr-progress-bar__fill" style={{ width: `${((currentImage + 1) / images.length) * 100}%` }} />
            </div>
            <span className="kr-progress-bar__label">{currentImage + 1} / {images.length}</span>
          </div>
        )}
      </header>

      {/* Reading area */}
      <main className={`kr-reader${mode === 'horizontal' ? ' kr-reader--horizontal' : ''}`}>
        {mode === 'vertical' ? (
          <div className="kr-vertical">
            {images.map((src, idx) => (
              <div key={idx} className="kr-vertical__page">
                {!loadedImages.has(idx) && (
                  <div className="kr-vertical__skeleton" aria-hidden="true">
                    <div className="kr-vertical__skeleton-shimmer" />
                  </div>
                )}
                <img
                  src={proxyImage(src)}
                  alt={`Halaman ${idx + 1}`}
                  className="kr-page"
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onLoad={() => onImageLoad(idx)}
                  onError={(e) => { devWarn('Image load failed:', src); e.target.style.opacity = '0.3'; }}
                />
                <span className="kr-vertical__label">{idx + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="kr-horizontal">
            <div className="kr-horizontal__viewport">
              <button type="button" className="kr-horizontal__nav kr-horizontal__nav--prev"
                onClick={() => (currentImage > 0 ? setCurrentImage((i) => i - 1) : goPrev())}
                disabled={currentImage === 0 && !prevSlug} aria-label={currentImage > 0 ? 'Halaman sebelumnya' : 'Chapter sebelumnya'}>
                ‹
              </button>
              <img
                src={proxyImage(images[currentImage])}
                alt={`Halaman ${currentImage + 1} dari ${images.length}`}
                className="kr-page kr-page--single"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.style.opacity = '0.3'; }}
              />
              <button type="button" className="kr-horizontal__nav kr-horizontal__nav--next"
                onClick={() => (currentImage < images.length - 1 ? setCurrentImage((i) => i + 1) : goNext())}
                disabled={currentImage === images.length - 1 && !nextSlug} aria-label={currentImage < images.length - 1 ? 'Halaman berikutnya' : 'Chapter berikutnya'}>
                ›
              </button>
            </div>
            <div className="kr-horizontal__info">
              <span className="kr-horizontal__hint">← → atau A D untuk navigasi</span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="kr-nav" aria-label="Navigasi chapter">
        <button type="button" className="kr-nav__btn kr-nav__btn--prev" onClick={goPrev} disabled={!prevSlug}>
          <span className="kr-nav__arrow">←</span>
          <div className="kr-nav__label">
            <span className="kr-nav__dir">Sebelumnya</span>
          </div>
        </button>
        <Link to="/komik" className="kr-nav__btn kr-nav__btn--home">
          📚 Daftar Komik
        </Link>
        <button type="button" className="kr-nav__btn kr-nav__btn--next" onClick={goNext} disabled={!nextSlug}>
          <div className="kr-nav__label">
            <span className="kr-nav__dir">Berikutnya</span>
          </div>
          <span className="kr-nav__arrow">→</span>
        </button>
      </nav>
      {(!prevSlug || !nextSlug) && (
        <p className="kr-nav__info">
          {!prevSlug && '📌 Chapter pertama'}
          {!prevSlug && !nextSlug && ' · '}
          {!nextSlug && '🏁 Chapter terbaru'}
        </p>
      )}
    </div>
  );
};

export default KomikReader;
