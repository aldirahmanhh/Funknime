import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Header from './components/Header'
import './App.css'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import InstallBanner from './components/InstallBanner'
import MaintenancePage from './components/MaintenancePage'
import AnimatedBackground from './components/AnimatedBackground'

const IS_MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

// Code-split the heavy / less-frequent routes. The video player
// pulls in @videojs/react which is by far the biggest dep.
const Ongoing = lazy(() => import('./components/Ongoing'))
const Completed = lazy(() => import('./components/Completed'))
const DonghuaOngoing = lazy(() => import('./components/DonghuaOngoing'))
const DonghuaCompleted = lazy(() => import('./components/DonghuaCompleted'))
const DonghuaDetail = lazy(() => import('./components/DonghuaDetail'))
const DonghuaGenres = lazy(() => import('./components/DonghuaGenres'))
const DonghuaGenreFilter = lazy(() => import('./components/DonghuaGenreFilter'))
const DonghuaAZList = lazy(() => import('./components/DonghuaAZList'))
const UnifiedSearch = lazy(() => import('./components/UnifiedSearch'))
const AnimeDetail = lazy(() => import('./components/AnimeDetail'))
const Watch = lazy(() => import('./components/Watch'))
const Genres = lazy(() => import('./components/Genres'))
const AZList = lazy(() => import('./components/AZList'))
const Schedule = lazy(() => import('./components/Schedule'))
const WatchHistory = lazy(() => import('./components/WatchHistory'))
const Komik = lazy(() => import('./components/Komik'))
const KomikDetail = lazy(() => import('./components/KomikDetail'))
const KomikReader = lazy(() => import('./components/KomikReader'))
const KomikGenres = lazy(() => import('./components/KomikGenres'))
const KomikBerwarna = lazy(() => import('./components/KomikBerwarna'))
const KomikByType = lazy(() => import('./components/KomikByType'))

const RouteFallback = () => (
  <div className="loading-container main-container" role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true" />
    <p>Memuat halaman...</p>
  </div>
);

function App() {
  if (IS_MAINTENANCE) {
    return <MaintenancePage />;
  }

  return (
    <ThemeProvider>
      <AnimatedBackground />
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      <div className="app" style={{ position: 'relative', zIndex: 1 }}>
        <Header />
        <InstallBanner />
        <main id="main-content">
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ongoing" element={<Ongoing />} />
                <Route path="/completed" element={<Completed />} />
                <Route path="/donghua-ongoing" element={<DonghuaOngoing />} />
                <Route path="/donghua-completed" element={<DonghuaCompleted />} />
                <Route path="/donghua-genres" element={<DonghuaGenres />} />
                <Route path="/donghua-genre/:slug" element={<DonghuaGenreFilter />} />
                <Route path="/donghua-az" element={<DonghuaAZList />} />
                <Route path="/donghua/:slug" element={<DonghuaDetail />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/az-list" element={<AZList />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/history" element={<WatchHistory />} />
                <Route path="/search" element={<UnifiedSearch />} />
                <Route path="/anime/:animeId" element={<AnimeDetail />} />
                <Route path="/anime/:provider/:animeId" element={<AnimeDetail />} />
                <Route path="/watch/:episodeId" element={<Watch />} />
                <Route path="/komik" element={<Komik />} />
                <Route path="/komik/genres" element={<KomikGenres />} />
                <Route path="/komik/berwarna" element={<KomikBerwarna />} />
                <Route path="/komik/type/:type" element={<KomikByType />} />
                <Route path="/komik/:slug" element={<KomikDetail />} />
                <Route path="/komik/read/:chapterSlug" element={<KomikReader />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App
