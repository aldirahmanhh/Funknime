import Icon from './Icon';

/**
 * Full-page error view — StateViews spec (DESIGN.md §5).
 * Icon circle (alert, surface-2 bg, 56px) + H3 title + one-line hint.
 */
const ErrorPage = ({ title, message, hint, onRetry }) => {
  return (
    <div className="error-container main-container" role="alert">
      <div className="error-icon" aria-hidden="true">
        <Icon name="alert" size={28} />
      </div>
      <h2>{title || 'Terjadi kesalahan'}</h2>
      {message && <p className="error-hint">{message}</p>}
      {hint && <p className="error-hint">{hint}</p>}
      <div className="error-actions">
        {onRetry && (
          <button type="button" className="btn btn-secondary" onClick={() => onRetry?.()}>
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
