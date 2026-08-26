import { Component } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      console.error('[ErrorBoundary] Render error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-container main-container" role="alert">
        <div className="error-icon" aria-hidden="true"><Icon name="alert" size={26} /></div>
        <h2>Ada yang Salah</h2>
        <p className="error-message">
          Halaman ini gagal dimuat. Coba muat ulang atau kembali ke beranda.
        </p>
        <p className="error-hint">
          Kalau masalahnya terus muncul, kabarin kami lewat tombol "Laporkan Bug" di footer.
        </p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={this.handleReload}>
            <Icon name="refresh" size={16} /> Muat Ulang
          </button>
          <Link to="/" className="btn btn-secondary" onClick={this.handleReset}>
            <Icon name="home" size={16} /> Ke Beranda
          </Link>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
