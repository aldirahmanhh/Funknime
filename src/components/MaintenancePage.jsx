/**
 * MaintenancePage — full-page overlay shown when VITE_MAINTENANCE_MODE=true.
 * Self-contained styles using CSS vars from index.css.
 */
export default function MaintenancePage() {
  return (
    <div style={styles.container}>
      <div style={styles.floatingBg} aria-hidden="true">
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
      </div>

      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary, #9333EA)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <h1 style={styles.title}>Sedang Maintenance</h1>
        <p style={styles.subtitle}>
          Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman kamu.
          Silakan kembali beberapa saat lagi.
        </p>

        <div style={styles.divider} />

        <p style={styles.footer}>
          <span style={styles.logo}>Funknime</span> &mdash; We&apos;ll be back soon!
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg, #0A0A0F)',
    fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
    padding: '1rem',
    overflow: 'hidden',
  },
  floatingBg: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.15,
  },
  blob1: {
    width: '400px',
    height: '400px',
    background: 'var(--color-primary, #9333EA)',
    top: '-10%',
    right: '-5%',
  },
  blob2: {
    width: '300px',
    height: '300px',
    background: 'var(--color-accent, #7C3AED)',
    bottom: '-10%',
    left: '-5%',
  },
  card: {
    position: 'relative',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    padding: '3rem 2rem',
    borderRadius: '1.5rem',
    background: 'var(--color-surface, rgba(255,255,255,0.03))',
    border: '2px solid var(--color-border, rgba(255,255,255,0.08))',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  iconWrap: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: 800,
    color: 'var(--color-text, #F8FAFC)',
    margin: '0 0 0.75rem',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-secondary, rgba(248,250,252,0.7))',
    lineHeight: 1.6,
    margin: 0,
  },
  divider: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent, var(--color-primary, #9333EA), transparent)',
    margin: '2rem auto',
    width: '60%',
    borderRadius: '1px',
  },
  footer: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary, rgba(248,250,252,0.5))',
    margin: 0,
  },
  logo: {
    fontWeight: 700,
    color: 'var(--color-primary, #9333EA)',
    fontFamily: "'Space Grotesk', sans-serif",
  },
};
