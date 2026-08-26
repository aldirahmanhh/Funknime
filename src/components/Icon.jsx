/**
 * Inline SVG icon set — MrFunk design system (DESIGN.md §5).
 * Single visual voice: 24px grid, 2px stroke, round caps.
 * Usage: <Icon name="search" size={18} />
 * No icon font, no external dependency, tree-shakeable by nature.
 */

const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  heart: <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.6 5 5 0 1 1 7.5 6.6Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  'arrow-left': <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 10h16M8 3v4m8-4v4" />
    </>
  ),
  flame: <path d="M12 3s1 2.4 1 4c2-.5 3-2 3-2 .6 1.2 1 2.6 1 4a5 5 0 0 1-10 0c0-1.6.6-3 1.5-4.2C9.4 3.6 12 3 12 3Zm0 18a3 3 0 0 0 3-3c0-1.5-1.4-2.6-3-4.5-1.6 1.9-3 3-3 4.5a3 3 0 0 0 3 3Z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </>
  ),
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zm0 0V20.5M20 18v3H6.5" />,
  layers: <path d="m12 3 9 5-9 5-9-5zm9 9-9 5-9-5m18 4-9 5-9-5" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v4h1" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.1 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
  'external-link': <path d="M15 4h5v5m0-5-8 8M19 13.9V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.1" />,
  home: <path d="m4 10 8-6 8 6v9a2 2 0 0 1-2 2h-4v-6h-4v6H6a2 2 0 0 1-2-2z" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6" />,
  'wifi-off': <path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3-2M2 8.8A15 15 0 0 1 7 6M22 8.8a15 15 0 0 0-9.5-2.7M12 20h.01" />,
  history: <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-7.6 4.2M3 3v5h5m4-1v5l3.5 2" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  sparkle: <path d="M12 3v4m0 10v4m-9-9h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8M8.4 15.6l-2.8 2.8" />,
};

export default function Icon({ name, size = 20, className = '', ...rest }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {path}
    </svg>
  );
}
