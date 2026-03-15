import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Header from './components/Header'
import './App.css'
import Ongoing from './components/Ongoing'
import Completed from './components/Completed'
import AnimeDetail from './components/AnimeDetail'
import Watch from './components/Watch'
import Genres from './components/Genres'
import AZList from './components/AZList'
import Search from './components/Search'
import Schedule from './components/Schedule'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      <div className="app">
        <div className="app-bg app-bg--sakura" aria-hidden="true">
          {[...Array(55)].map((_, i) => (
            <div
              key={i}
              className={`sakura-petal sakura-petal--${(i % 6) + 1}`}
              style={{
                '--i': i,
                left: `${(i / 54) * 100}%`,
                animationDuration: `${12 + (i % 8) * 1.5}s`,
                animationDelay: `${i * -0.8}s`,
              }}
            />
          ))}
        </div>
        <Header />
        <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ongoing" element={<Ongoing />} />
          <Route path="/completed" element={<Completed />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/az-list" element={<AZList />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search/:query" element={<Search />} />
          <Route path="/anime/:animeId" element={<AnimeDetail />} />
          <Route path="/watch/:episodeId" element={<Watch />} />
        </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App