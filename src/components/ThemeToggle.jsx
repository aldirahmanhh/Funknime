import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="theme-toggle-inner">
        <div className={`sun ${theme === 'dark' ? 'active' : ''}`}>☀️</div>
        <div className={`moon ${theme === 'light' ? 'active' : ''}`}>🌙</div>
      </div>
    </button>
  );
};

export default ThemeToggle;