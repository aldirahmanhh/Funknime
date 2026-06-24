import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { comicAPI } from '../services/api';
import './KomikReader.css';

/**
 * Route komiku.org image URLs through the server-side proxy so they load
 * without triggering hotlink protection (which blocks the Referer header that
 * Vercel's global Referrer-Policy injects on every request).
 */
const KOMIKU_HOSTS = ['img.komiku.org', 'thumbnail.komiku.org', 'komiku.org'];

/**
 * Route komiku.org images through server-side proxy to bypass hotlink protection.
 * Falls back to direct URL if first attempt fails (proxy may block CORS).
 */
const proxyImg = (url) => {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  
  let needsProxy = false;
   try {
     const testUrl = !url.startsWith('http') ? `https://${url}` : url;
     const { hostname } = new URL(testUrl);
     needsProxy = KOMIKU_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`));
   } catch {
     // Ignore invalid URLs — will return original url unchanged
   }
  
  return needsProxy ? `/api/img-proxy?url=${encodeURIComponent(url)}` : url;
};

// Always log errors (works in production)
const logError = (...args) => console.error('[KomikReader]', ...args);
const logInfo = (...args) => console.log('[KomikReader]', ...args);

const KomikReader = () => {
  const { chapterSlug } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readMode, setReadMode] = useState('vertical'); // 'vertical' | 'horizontal'
  const [retryCount, setRetryCount] = useState(0);
  const failedProxyAttemptsRef = useRef(new WeakSet()); // Track per-image failures

  const fetchChapter = useCallback(async (slug, signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await comicAPI.getComicChapter(slug, { signal });
      
      // Normalize response — handle different possible structures
      let normalizedRes = res;
      if (res && typeof res === 'object') {
        // If images is nested under different field, extract it
        const images = res.images ?? res.data?.images ?? res.pages ?? res.data?.pages ?? [];
        if (!res.images && Array.isArray(images) && images.length > 0) {
          normalizedRes = { ...res, images };
        }
      }
      
      setChapter(normalizedRes);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err?.message ?? 'Gagal memuat chapter');
        logError('fetch failed:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!chapterSlug) return;
    const ctrl = new AbortController();
    setChapter(null);
    fetchChapter(chapterSlug, ctrl.signal);
    // Scroll to top on new chapter
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => ctrl.abort();
  }, [chapterSlug, fetchChapter, retryCount]);

  // Keyboard navigation
  useEffect(() => {
    if (!chapter?.navigation) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft' && chapter.navigation.previousChapter) {
        navigate(`/komik/read/${chapter.navigation.previousChapter}`);
      } else if (e.key === 'ArrowRight' && chapter.navigation.nextChapter) {
        navigate(`/komik/read/${chapter.navigation.nextChapter}`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [chapter, navigate]);

  if (loading) {
    return (
      <div className="kr-loading main-container" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Memuat chapter…</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="error-container main-container">
        <div className="error-icon" aria-hidden="true">📖</div>
        <h2>Chapter Tidak Ditemukan</h2>
        <p className="error-message">{error ?? 'Chapter tidak ditemukan'}</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => setRetryCount(c => c + 1)}>
            🔄 Coba Lagi
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Kembali
          </button>
          <Link to="/komik" className="btn btn-secondary">Daftar Komik</Link>
        </div>
      </div>
    );
  }

  const mangaTitle = chapter.manga_title ?? 'Unknown';
  const chapterTitle = chapter.chapter_title ?? 'Chapter';
  const nav = chapter.navigation ?? {};
  const images = Array.isArray(chapter.images) ? chapter.images : [];
  const prevSlug = nav.previousChapter ?? null;
  const nextSlug = nav.nextChapter ?? null;
  const chapterListSlug = nav.chapterList ?? null;

  return (
    <article className="kr main-container" aria-labelledby="kr-title">

      {/* ── Top bar ── */}
      <header className="kr-topbar">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/komik">Komik</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          {chapterListSlug && (
            <>
              <Link to={`/komik/${chapterListSlug}`}>{mangaTitle}</Link>
              <span className="breadcrumb-sep" aria-hidden="true">/</span>
            </>
          )}
          <span className="breadcrumb-current" aria-current="page">{chapterTitle}</span>
        </nav>

        <h1 id="kr-title" className="kr-title">
          <span className="kr-title__manga">{mangaTitle}</span>
          <span className="kr-title__chapter">{chapterTitle}</span>
        </h1>

        <div className="kr-controls" role="group" aria-label="Kontrol reader">
          <button
            type="button"
            className="btn btn-secondary kr-mode-btn"
            onClick={() => setReadMode(m => m === 'vertical' ? 'horizontal' : 'vertical')}
            aria-label="Toggle mode baca"
          >
            {readMode === 'vertical' ? ' ↔ Mode Horizontal' : ' ↕ Mode Vertikal'}
          </button>
        </div>
      </header>

      {/* ── Images ── */}
      {images.length === 0 ? (
        <div className="kr-empty section section-neo">
          <p>Halaman tidak tersedia</p>
          <p className="error-hint">Chapter mungkin belum diunggah atau API bermasalah</p>
        </div>
      ) : readMode === 'vertical' ? (
        <div className="kr-images kr-images--vertical" role="img" aria-label={`${images.length} halaman`}>
            {images.map((src, idx) => {
              const proxiedUrl = proxyImg(src);
              return (
                <img
                  key={idx}
                  src={proxiedUrl}
                  alt={`Halaman ${idx + 1}`}
                  className="kr-page"
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(e) => {
                    logError('Image failed:', { index: idx, original: src, url: e.target.src });
                    // Try direct komiku URL as fallback if proxy failed
                    if (e.target.src !== src && !failedProxyAttemptsRef.current.has(e.target)) {
                      failedProxyAttemptsRef.current.add(e.target);
                      logInfo('Retrying direct load...');
                      e.target.src = src;
                    } else {
                      e.target.style.opacity = '0.3';
                      e.target.alt = `Halaman ${idx + 1} gagal dimuat`;
                    }
                  }}
                />
              );
            })}
         </div>
      ) : (
        <HorizontalReader key={images[0] ?? 'reader'} images={images} />
      )}

      {/* ── Bottom navigation ── */}
      <nav className="kr-nav" aria-label="Navigasi chapter">
        <button
          type="button"
          className="btn btn-secondary kr-nav__btn"
          onClick={() => prevSlug && navigate(`/komik/read/${prevSlug}`)}
          disabled={!prevSlug}
          aria-disabled={!prevSlug}
        >
          ← Chapter Sebelumnya
        </button>

        {chapterListSlug && (
          <Link to={`/komik/${chapterListSlug}`} className="btn btn-primary kr-nav__btn">
            Daftar Chapter
          </Link>
        )}

        <button
          type="button"
          className="btn btn-secondary kr-nav__btn"
          onClick={() => nextSlug && navigate(`/komik/read/${nextSlug}`)}
          disabled={!nextSlug}
          aria-disabled={!nextSlug}
        >
          Chapter Berikutnya →
        </button>
      </nav>

      {(!prevSlug || !nextSlug) && (
        <p className="kr-nav__hint">
          {!prevSlug && '⚠ Ini chapter pertama. '}
          {!nextSlug && '⚠ Ini chapter terbaru. '}
        </p>
      )}
    </article>
  );
};

// Horizontal reader — page-by-page with click navigation
const HorizontalReader = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const total = images.length;
  const failedProxyAttemptsRef = useRef(new WeakSet()); // Track per-image failures
  
  const goNext = () => setCurrent(c => Math.min(total - 1, c + 1));
  const goPrev = () => setCurrent(c => Math.max(0, c - 1));

  return (
    <div className="kr-horizontal" role="region" aria-label="Reader horizontal">
      <div className="kr-horizontal__page">
        <img
          src={proxyImg(images[current])}
          alt={`Halaman ${current + 1} dari ${total}`}
          className="kr-page kr-page--single"
          decoding="async" 
          ref={(img) => {
            if (img && img.complete) {
              img.onload = null;
              img.onerror = (e) => {
                logError('Horizontal image failed:', { index: current, url: e.target.src });
                const src = images[current];
                if (e.target.src !== src && !failedProxyAttemptsRef.current.has(e.target)) {
                  failedProxyAttemptsRef.current.add(e.target);
                  logInfo('Retrying direct load...');
                  e.target.src = src;
                } else {
                  e.target.style.opacity = '0.3';
                }
              };
            }
          }}
        />
        <button
          type="button"
          className="kr-horizontal__nav kr-horizontal__nav--prev"
          onClick={goPrev}
          disabled={current === 0}
          aria-label="Halaman sebelumnya"
        >
          ‹
        </button>
        <button
          type="button"
          className="kr-horizontal__nav kr-horizontal__nav--next"
          onClick={goNext}
          disabled={current === total - 1}
          aria-label="Halaman berikutnya"
        >
          ›
        </button>
      </div>
      <div className="kr-horizontal__counter" role="status" aria-live="polite">
        {current + 1} / {total}
      </div>
    </div>
  );
};

export default KomikReader;
