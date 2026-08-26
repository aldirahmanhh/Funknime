import { useEffect, useRef, useState } from 'react';
import { animeAPI } from '../services/api';
import { SkeletonAnimeGrid } from './Skeleton';
import AnimeCard from './AnimeCard';
import ErrorPage from './ErrorPage';
import './Schedule.css';

const DAY_ORDER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const normalizeKey = (item) =>
  (item.title || item.name || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();

const mergeScheduleLists = (list1, list2) => {
  const map = new Map();

  list1.forEach((a) => {
    const key = normalizeKey(a);
    map.set(key, { ...a, providers: ['otakudesu'], provider: 'otakudesu' });
  });

  list2.forEach((a) => {
    const key = normalizeKey(a);
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, providers: ['otakudesu', 'samehadaku'] });
    } else {
      map.set(key, { ...a, providers: ['samehadaku'], provider: 'samehadaku' });
    }
  });

  return Array.from(map.values());
};

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const dayRefs = useRef({});
  const tabsRef = useRef(null);

  const todayName = DAY_ORDER[new Date().getDay()];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const [otakRes, sameRes] = await Promise.all([
          animeAPI.getSchedule().catch(() => null),
          animeAPI.getScheduleSamehadaku().catch(() => null),
        ]);

        const otakDays = Array.isArray(otakRes?.data) ? otakRes.data : [];
        const sameDays = Array.isArray(sameRes?.data?.schedule) ? sameRes.data.schedule : [];

        const dayMap = new Map();

        const processDay = (dayItem, provider) => {
          const dayName = dayItem.day;
          const list = dayItem.anime_list ?? dayItem.animeList ?? dayItem.list ?? [];
          if (!dayName) return;
          if (!dayMap.has(dayName)) dayMap.set(dayName, []);
          const merged = mergeScheduleLists(dayMap.get(dayName), list.map(a => ({ ...a, provider })));
          dayMap.set(dayName, merged);
        };

        otakDays.forEach(d => processDay(d, 'otakudesu'));
        sameDays.forEach(d => processDay(d, 'samehadaku'));

        const mergedDays = DAY_ORDER
          .filter(d => dayMap.has(d))
          .map(day => ({ day, animeList: dayMap.get(day) }));

        // Also include any days not in DAY_ORDER
        dayMap.forEach((list, day) => {
          if (!DAY_ORDER.includes(day)) mergedDays.push({ day, animeList: list });
        });

        setScheduleData({ data: mergedDays });

        // Default active = today if present, else first day
        const todayPresent = mergedDays.find(d => d.day === todayName);
        setActiveDay(todayPresent ? todayName : (mergedDays[0]?.day ?? null));
      } catch (err) {
        const msg = (err?.message ?? String(err)) || 'Gagal memuat jadwal';
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToDay = (dayName) => {
    setActiveDay(dayName);
    const el = dayRefs.current[dayName];
    if (el) {
      const offset = 80; // account for sticky tabs height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    // scroll tab into view
    if (tabsRef.current) {
      const btn = tabsRef.current.querySelector(`[data-day="${dayName}"]`);
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  if (loading) {
    return (
      <div className="schedule-page main-container">
        <header className="page-header">
          <div className="skeleton skeleton-text" style={{ height: 40, width: 200 }} />
          <div className="skeleton skeleton-text" style={{ height: 20, width: 320, marginTop: 8 }} />
        </header>
        <div className="schedule-summary-grid">
          {DAY_ORDER.map(d => (
            <div key={d} className="skeleton" style={{ height: 44, width: 90, borderRadius: 10, flexShrink: 0 }} />
          ))}
        </div>
        <section className="section">
          <SkeletonAnimeGrid count={6} />
        </section>
      </div>
    );
  }

  if (error != null && error !== '') {
    return (
      <div className="main-container">
        <ErrorPage
          title="Jadwal Tayang"
          message={`Gagal memuat jadwal: ${error}`}
          hint="Server mungkin sedang bermasalah. Coba lagi nanti."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const days = Array.isArray(scheduleData?.data) ? scheduleData.data : [];

  return (
    <div className="schedule-page main-container">
      <header className="page-header">
        <h1>Jadwal Tayang</h1>
        <p className="subtitle">Anime yang tayang per hari — hari ini: <strong>{todayName}</strong></p>
      </header>

      {/* Sticky day pills */}
      {days.length > 0 && (
        <div className="schedule-tabs-wrapper" role="navigation" aria-label="Navigasi hari">
          <div className="schedule-day-grid" ref={tabsRef}>
            {days.map((dayItem) => {
              const isToday = dayItem.day === todayName;
              const isActive = dayItem.day === activeDay;
              const count = (dayItem.animeList ?? []).length;
              return (
                <button
                  key={dayItem.day}
                  type="button"
                  data-day={dayItem.day}
                  className={`schedule-day-pill${isActive ? ' schedule-day-pill--active' : ''}${isToday ? ' schedule-day-pill--today' : ''}`}
                  onClick={() => scrollToDay(dayItem.day)}
                  aria-pressed={isActive}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {isToday && <span className="schedule-day-pill-dot" aria-hidden="true" />}
                  <span className="schedule-day-pill-name">{dayItem.day}</span>
                  <span className="schedule-day-pill-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {days.length > 0 ? (
        days.map((dayItem, idx) => {
          const dayName = dayItem.day ?? `Day ${idx + 1}`;
          const list = dayItem.animeList ?? dayItem.anime_list ?? dayItem.anime ?? [];
          const isToday = dayName === todayName;
          return (
            <section
              key={`${dayName}-${idx}`}
              className="schedule-day-section section"
              ref={el => { dayRefs.current[dayName] = el; }}
            >
              <div className="section-header schedule-section-header">
                <h2 className="section-title">
                  {isToday && <span className="text-eyebrow" style={{ color: 'var(--accent-text)', marginRight: 'var(--space-2)' }}>Hari ini</span>}
                  {dayName}
                </h2>
                <span className="num" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{list.length} anime</span>
              </div>
              <div className="anime-grid">
                {list.map((anime, i) => {
                  const providers = anime.providers || [anime.provider];
                  const hasOtak = providers.includes('otakudesu');
                  const hasSame = providers.includes('samehadaku');
                  const providerHint = hasOtak && hasSame ? 'Otakudesu & Samehadaku' : (hasSame ? 'Samehadaku' : 'Otakudesu');

                  return (
                    <AnimeCard
                      key={anime.animeId ?? anime.slug ?? i}
                      anime={{ ...anime, animeId: anime.animeId ?? anime.slug, provider: anime.provider ?? 'otakudesu' }}
                      index={i}
                      providerHint={providerHint}
                    />
                  );
                })}
              </div>
            </section>
          );
        })
      ) : (
        <div className="empty-state">
          <p>Belum ada data jadwal.</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;
