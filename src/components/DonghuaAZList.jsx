import { useState, useEffect } from 'react';
import { animeAPI } from '../services/api';
import AnimeCard from './AnimeCard';

const DonghuaAZList = () => {
  const [donghua, setDonghua] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState('a');
  const [page, setPage] = useState(1);

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  useEffect(() => {
    const fetchDonghua = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await animeAPI.getDonghuaAZList(selectedLetter, page);
        setDonghua(response?.donghua_list || []);
      } catch (err) {
        setError(err?.message ?? 'Gagal memuat donghua');
      } finally {
        setLoading(false);
      }
    };
    fetchDonghua();
  }, [selectedLetter, page]);

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="main-title text-gradient">Donghua A-Z</h1>
        <p className="subtitle">Browse donghua berdasarkan abjad</p>
      </header>

      {/* A-Z Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
        {letters.map(letter => (
          <button
            key={letter}
            type="button"
            onClick={() => { setSelectedLetter(letter); setPage(1); }}
            style={{
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: selectedLetter === letter ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedLetter === letter ? '#fff' : 'var(--color-text-muted)',
              border: `1px solid ${selectedLetter === letter ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: 'var(--text-sm)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <div className="loading-container"><div className="spinner" /></div>}
      {error && <div className="error-container"><p className="error-message">{error}</p></div>}

      {!loading && donghua.length > 0 && (
        <>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {donghua.length} donghua dengan huruf "{selectedLetter.toUpperCase()}"
          </p>
          <div className="anime-grid">
            {donghua.map((item, idx) => (
              <AnimeCard key={item.slug || idx} anime={{ ...item, animeId: item.slug, provider: 'donghua' }} index={idx} providerHint="Donghua" />
            ))}
          </div>
        </>
      )}

      {!loading && donghua.length === 0 && !error && (
        <div className="empty-state"><p>Tidak ada donghua dengan huruf "{selectedLetter.toUpperCase()}"</p></div>
      )}

      {donghua.length > 0 && (
        <div className="pagination" style={{ marginTop: 'var(--space-6)', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            ← Prev
          </button>
          <span className="page-info">Hal {page}</span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setPage((p) => p + 1)}
            disabled={donghua.length < 10 || loading}
            aria-disabled={donghua.length < 10 || loading}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default DonghuaAZList;
