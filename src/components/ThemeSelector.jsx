import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const THEMES = [
  { id: 'dark', icon: '🌙', label: 'Dark' },
  { id: 'minimal', icon: '✨', label: 'Minimal' },
  { id: 'neobrutalism', icon: '🎨', label: 'Neobrutalism' },
];

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const changeTheme = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  const currentThemeData = THEMES.find(t => t.id === theme);

  return (
    <div className={`theme-selector ${!isOpen ? 'collapsed' : ''}`}>
      <button
        className="theme-toggle-btn"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle theme selector"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Change theme"
      >
        {currentThemeData?.icon || '🎨'}
      </button>

      {isOpen && THEMES.map(t => (
        <button
          key={t.id}
          type="button"
          className={`theme-option ${theme === t.id ? 'active' : ''}`}
          onClick={() => changeTheme(t.id)}
          data-theme={t.id}
          aria-label={`Switch to ${t.label} theme`}
          aria-pressed={theme === t.id}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;
