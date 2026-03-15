/**
 * Full-page error view so error is always visible (e.g. when API returns 500).
 * Use for Genres, AZList, Schedule and any page that needs a clear error state.
 */
const ErrorPage = ({ title, message, hint, onRetry }) => {
  return (
    <div className="error-page" role="alert">
      <div className="error-page-inner">
        <div className="error-page-icon" aria-hidden>⚠️</div>
        <h1 className="error-page-title">{title}</h1>
        <p className="error-page-message">{message}</p>
        {hint && <p className="error-page-hint">{hint}</p>}
        <button
          type="button"
          className="btn btn-primary error-page-btn"
          onClick={() => onRetry?.()}
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
