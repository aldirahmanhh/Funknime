import Icon from './Icon';

/**
 * MaintenancePage — full-page overlay shown when VITE_MAINTENANCE_MODE=true.
 * Quiet tonal treatment per DESIGN.md; tokens from index.css.
 */
export default function MaintenancePage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <Icon name="sparkle" size={28} />
        </div>

        <h1 style={styles.title}>Sedang Maintenance</h1>
        <p style={styles.subtitle}>
          Kami sedang melakukan pemeliharaan untuk meningkatkan pengalaman kamu.
          Silakan kembali beberapa saat lagi.
        </p>

        <div style={styles.divider} />

        <p style={styles.footer}>
          <span style={styles.logo}>MrFunk</span> &mdash; segera kembali
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
    background: 'var(--bg, #0A0A10)',
    fontFamily: "'Outfit', system-ui, sans-serif",
    padding: '1rem',
    overflow: 'hidden',
  },
  card: {
    position: 'relative',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
    padding: '3rem 2rem',
    borderRadius: '16px',
    background: 'var(--surface-1, #12121A)',
    boxShadow: 'var(--shadow-xl, 0 24px 64px rgba(0,0,0,0.6))',
  },
  iconWrap: {
    width: '64px',
    height: '64px',
    margin: '0 auto 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'var(--surface-2, #181822)',
    color: 'var(--text-muted, #7E7E9C)',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary, #F2F2F7)',
    margin: '0 0 0.75rem',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary, #A2A2B5)',
    lineHeight: 1.65,
    margin: 0,
  },
  divider: {
    height: '1px',
    background: 'var(--border-subtle, #1F1F2B)',
    margin: '2rem auto 1.25rem',
    width: '100%',
  },
  footer: {
    fontSize: '0.875rem',
    color: 'var(--text-muted, #7E7E9C)',
    margin: 0,
  },
  logo: {
    fontWeight: 700,
    color: 'var(--text-primary, #F2F2F7)',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
};
