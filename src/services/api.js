// Dev-only logger. Stripped/silent in production.
const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
const devLog = (...args) => { if (isDev) console.log(...args); };
const devError = (...args) => { if (isDev) console.error(...args); };

const API_BASE_URL = 'https://www.sankavollerei.web.id/anime';

// ═══════════════════════════════════════════════════════
// TWO-LAYER CACHE — L1: in-memory (fast), L2: localStorage (persistent)
// ═══════════════════════════════════════════════════════
const L1 = new Map(); // in-memory, cleared on page reload
const LS_PREFIX = 'fnk_cache_';
const LS_MAX_ENTRIES = 60; // guard against localStorage bloat

const CACHE_TTL = {
  long:   30 * 60 * 1000,  // 30 min — genres, az-list, schedule
  medium: 10 * 60 * 1000,  // 10 min — home, ongoing, completed
  short:   3 * 60 * 1000,  //  3 min — episode detail, search
};

const getCacheTTL = (url) => {
  if (url.includes('/genre') || url.includes('/unlimited') || url.includes('/schedule'))
    return CACHE_TTL.long;
  if (url.includes('/search') || url.includes('/episode') || url.includes('/server'))
    return CACHE_TTL.short;
  return CACHE_TTL.medium;
};

// Prune expired localStorage entries to stay under LS_MAX_ENTRIES
const pruneLS = () => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    const now = Date.now();
    let expired = keys.filter(k => {
      try { return now > JSON.parse(localStorage.getItem(k)).expiry; } catch { return true; }
    });
    expired.forEach(k => localStorage.removeItem(k));
    // If still too many, remove oldest by expiry
    const remaining = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    if (remaining.length > LS_MAX_ENTRIES) {
      const sorted = remaining
        .map(k => { try { return { k, expiry: JSON.parse(localStorage.getItem(k)).expiry }; } catch { return { k, expiry: 0 }; } })
        .sort((a, b) => a.expiry - b.expiry);
      sorted.slice(0, sorted.length - LS_MAX_ENTRIES).forEach(({ k }) => localStorage.removeItem(k));
    }
  } catch { /* localStorage unavailable */ }
};

const getFromCache = (url) => {
  // L1 hit — fastest path
  const l1 = L1.get(url);
  if (l1) {
    if (Date.now() <= l1.expiry) return l1.data;
    L1.delete(url);
  }
  // L2 hit — localStorage survives page reload
  try {
    const raw = localStorage.getItem(LS_PREFIX + url);
    if (raw) {
      const entry = JSON.parse(raw);
      if (Date.now() <= entry.expiry) {
        L1.set(url, entry); // promote to L1
        return entry.data;
      }
      localStorage.removeItem(LS_PREFIX + url);
    }
  } catch { /* ignore parse errors */ }
  return null;
};

const setCache = (url, data) => {
  const ttl = getCacheTTL(url);
  const entry = { data, expiry: Date.now() + ttl };
  L1.set(url, entry);
  try {
    pruneLS();
    localStorage.setItem(LS_PREFIX + url, JSON.stringify(entry));
  } catch { /* quota exceeded — L1 only */ }
};

// ═══════════════════════════════════════════════════════
// GLOBAL RATE LIMITER — 40 req/min (safe margin from 50)
// Only blocks when approaching limit — requests are parallel by default
// ═══════════════════════════════════════════════════════
const globalRequests = [];
const MAX_REQUESTS_PER_MINUTE = 40;

const isRateLimited = () => {
  const now = Date.now();
  while (globalRequests.length > 0 && now - globalRequests[0] > 60000) {
    globalRequests.shift();
  }
  return globalRequests.length >= MAX_REQUESTS_PER_MINUTE;
};

const trackRequest = () => {
  globalRequests.push(Date.now());
};

// Wait until under rate limit (non-blocking for other parallel requests)
const waitForRateLimit = async () => {
  let attempts = 0;
  while (isRateLimited() && attempts < 5) {
    await new Promise(r => setTimeout(r, 1500));
    attempts++;
  }
  if (isRateLimited()) throw new Error('Server sedang sibuk. Tunggu sebentar lalu coba lagi.');
};

// enqueue kept for backward compat but now just parallel with rate-limit guard
const enqueue = (fn) => fn();

// Debounce function
export const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// Error logging utility
export const logAPIError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    error: error.message,
    name: error.name,
    stack: error.stack,
    context,
  };
  
  devError('API Error:', errorData);
  
  // Log to error tracking service (if available)
  if (typeof window !== 'undefined' && window.onerror) {
    window.onerror(error.message, window.location.href, null, null, error);
  }
  
  return errorData;
};

// Enhanced error handling
export class APIError extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

// Utility functions
export const formatAnimeData = (data) => {
  if (!data || !data.results) return data;
  
  return data.results.map(anime => ({
    ...anime,
    title: anime.title || anime.name || anime.series_title,
    slug: anime.slug || anime.series_slug,
    image: anime.image || anime.cover_image || anime.thumbnail,
    episodes: anime.episodes || anime.episode_count,
    status: anime.status || anime.airing_status,
    type: anime.type || anime.series_type,
    year: anime.year || anime.release_year,
  }));
};

export const formatEpisodeData = (data) => {
  if (!data || !data.episodes) return data;
  
  return data.episodes.map(episode => ({
    ...episode,
    title: episode.title || episode.episode_title,
    slug: episode.slug || episode.episode_slug,
    number: episode.number || episode.episode_number,
    air_date: episode.air_date || episode.release_date,
    duration: episode.duration || episode.running_time,
  }));
};

export const formatServerData = (data) => {
  if (!data || !data.servers) return data;
  
  return data.servers.map(server => ({
    ...server,
    name: server.name || server.server_name,
    url: server.url || server.stream_url,
    quality: server.quality || server.resolution,
  }));
};

// Cache management
export const clearCache = () => {
  L1.clear();
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(LS_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
};

export const getCacheSize = () => L1.size;

export const getCacheKeys = () => Array.from(L1.keys());

// Clear cache for specific pattern
export const clearCachePattern = (pattern) => {
  const keys = Array.from(L1.keys()).filter(key => pattern.test(key));
  keys.forEach(key => {
    L1.delete(key);
    try { localStorage.removeItem(LS_PREFIX + key); } catch { /* ignore */ }
  });
};

// Enhanced API fetching with smart cache, global rate limit, and request queue
const fetchAnime = async (endpoint, provider = 'default', { priority = false, signal } = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Abort early if caller already cancelled
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // 1. Check cache first — no network needed
  const cachedData = getFromCache(url);
  if (cachedData) return cachedData;

  // 2. Check global rate limit — only blocks when near threshold
  if (isRateLimited()) {
    await waitForRateLimit();
  }

  // 3. Priority requests skip queue (episode detail, server fetch)
  const doFetch = async () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const cached2 = getFromCache(url);
    if (cached2) return cached2;
    trackRequest();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        // Rate limited by server — wait and retry once
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 3000));
          const retry = await fetch(url, { headers: { 'Accept': 'application/json' }, signal });
          if (retry.ok) {
            const retryData = await retry.json();
            setCache(url, retryData);
            return retryData;
          }
          throw new APIError('Server rate limit. Coba lagi dalam beberapa detik.', 429);
        }

        let parsed = null;
        if (contentType.includes('application/json')) {
          try { parsed = await response.json(); } catch { /* ignore */ }
        }

        if (response.status === 404) {
          throw new APIError('Episode atau anime tidak ditemukan', 404);
        }

        if (parsed && typeof parsed === 'object') return parsed;

        throw new APIError(`Server error: ${response.status}`, response.status);
      }

      const data = await response.json();
      setCache(url, data);
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      if (error instanceof APIError) throw error;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Gagal terhubung ke server. Periksa koneksi internet.');
      }
      throw error;
    }
  };

  // Priority requests execute immediately, others go through queue
  if (priority) return doFetch();
  return enqueue(doFetch);
};

// Provider-specific API endpoints
const providers = {
  otakudesu: {
    getHome: () => fetchAnime('/home', 'otakudesu'),
    getSchedule: () => fetchAnime('/schedule', 'otakudesu'),
    getOngoing: (page = 1) => fetchAnime(`/ongoing-anime?page=${page}`, 'otakudesu'),
    getCompleted: (page = 1) => fetchAnime(`/complete-anime?page=${page}`, 'otakudesu'),
    getGenres: () => fetchAnime('/genre', 'otakudesu'),
    getGenreAnime: (slug) => fetchAnime(`/genre/${slug}`, 'otakudesu'),
    search: (keyword) => fetchAnime(`/search/${encodeURIComponent(keyword)}`, 'otakudesu'),
    getAnimeDetail: (slug) => fetchAnime(`/anime/${slug}`, 'otakudesu'),
    getEpisodeDetail: (slug) => fetchAnime(`/episode/${slug}`, 'otakudesu', { priority: true }),
    getStreamingServer: (serverId) => fetchAnime(`/server/${serverId}`, 'otakudesu', { priority: true }),
    getBatch: (slug) => fetchAnime(`/batch/${slug}`, 'otakudesu'),
    getUnlimited: () => fetchAnime('/unlimited', 'otakudesu'),
  },
  
  donghua: {
    getHome: (page = 1) => fetchAnime(`/donghua/home/${page}`, 'donghua'),
    getOngoing: (page = 1) => fetchAnime(`/donghua/ongoing/${page}`, 'donghua'),
    getCompleted: (page = 1) => fetchAnime(`/donghua/completed/${page}`, 'donghua'),
    getGenres: () => fetchAnime('/donghua/genres', 'donghua'),
    getGenreAnime: (slug, page = 1) => fetchAnime(`/donghua/genres/${slug}/${page}`, 'donghua'),
    getAZList: (letter, page = 1) => fetchAnime(`/donghua/az-list/${letter}/${page}`, 'donghua'),
    search: (keyword) => fetchAnime(`/donghua/search/${encodeURIComponent(keyword)}`, 'donghua'),
  },
  
  samehadaku: {
    getHome: () => fetchAnime('/samehadaku/home', 'samehadaku'),
    getOngoing: () => fetchAnime('/samehadaku/ongoing', 'samehadaku'),
    getCompleted: () => fetchAnime('/samehadaku/completed', 'samehadaku'),
    getPopular: () => fetchAnime('/samehadaku/popular', 'samehadaku'),
    getMovies: () => fetchAnime('/samehadaku/movies', 'samehadaku'),
    getList: () => fetchAnime('/samehadaku/list', 'samehadaku'),
    getSchedule: () => fetchAnime('/samehadaku/schedule', 'samehadaku'),
    getGenres: () => fetchAnime('/samehadaku/genres', 'samehadaku'),
    getGenreAnime: (genreId) => fetchAnime(`/samehadaku/genres/${genreId}`, 'samehadaku'),
    search: (keyword) => fetchAnime(`/samehadaku/search?q=${encodeURIComponent(keyword)}`, 'samehadaku'),
    getAnimeDetail: (animeId) => fetchAnime(`/samehadaku/anime/${animeId}`, 'samehadaku'),
    getEpisodeDetail: (episodeId) => fetchAnime(`/samehadaku/episode/${episodeId}`, 'samehadaku', { priority: true }),
    getStreamingServer: (serverId) => fetchAnime(`/samehadaku/server/${serverId}`, 'samehadaku'),
    getBatchList: () => fetchAnime('/samehadaku/batch', 'samehadaku'),
    getBatchDetail: (batchId) => fetchAnime(`/samehadaku/batch/${batchId}`, 'samehadaku'),
  },
  
  kusonime: {
    getLatest: () => fetchAnime('/kusonime/latest', 'kusonime'),
    getAll: () => fetchAnime('/kusonime/all-anime', 'kusonime'),
    getGenres: () => fetchAnime('/kusonime/all-genres', 'kusonime'),
    getGenreAnime: (slug) => fetchAnime(`/kusonime/genre/${slug}`, 'kusonime'),
    search: (keyword) => fetchAnime(`/kusonime/search/${encodeURIComponent(keyword)}`, 'kusonime'),
  },
  
  anoboy: {
    getHome: () => fetchAnime('/anoboy/home', 'anoboy'),
    getList: () => fetchAnime('/anoboy/list', 'anoboy'),
    getGenres: () => fetchAnime('/anoboy/genres', 'anoboy'),
    getGenreAnime: (slug) => fetchAnime(`/anoboy/genre/${slug}`, 'anoboy'),
    search: (keyword) => fetchAnime(`/anoboy/search/${encodeURIComponent(keyword)}`, 'anoboy'),
    getAnimeDetail: (slug) => fetchAnime(`/anoboy/anime/${slug}`, 'anoboy'),
    getEpisodeDetail: (slug) => fetchAnime(`/anoboy/episode/${slug}`, 'anoboy'),
    getAZList: () => fetchAnime('/anoboy/az-list', 'anoboy'),
  },

  oploverz: {
    getHome: () => fetchAnime('/oploverz/home', 'oploverz'),
    getSchedule: () => fetchAnime('/oploverz/schedule', 'oploverz'),
    getOngoing: () => fetchAnime('/oploverz/ongoing', 'oploverz'),
    getCompleted: () => fetchAnime('/oploverz/completed', 'oploverz'),
    getList: () => fetchAnime('/oploverz/list', 'oploverz'),
    search: (keyword) => fetchAnime(`/oploverz/search/${encodeURIComponent(keyword)}`, 'oploverz'),
    getAnimeDetail: (slug) => fetchAnime(`/oploverz/anime/${slug}`, 'oploverz'),
    getEpisodeDetail: (slug) => fetchAnime(`/oploverz/episode/${slug}`, 'oploverz'),
  },
  
  stream: {
    getLatest: () => fetchAnime('/stream/latest', 'stream'),
    getPopular: () => fetchAnime('/stream/popular', 'stream'),
    getList: () => fetchAnime('/stream/list', 'stream'),
    getMovie: () => fetchAnime('/stream/movie', 'stream'),
    getGenres: () => fetchAnime('/stream/genres', 'stream'),
    getGenreAnime: (slug) => fetchAnime(`/stream/genres/${slug}`, 'stream'),
    search: (keyword) => fetchAnime(`/stream/search/${encodeURIComponent(keyword)}`, 'stream'),
    getAnimeDetail: (slug) => fetchAnime(`/stream/anime/${slug}`, 'stream'),
    getEpisodeDetail: (slug) => fetchAnime(`/stream/episode/${slug}`, 'stream', { priority: true }),
  },
};

// Provider switching and search functionality
export const animeAPI = {
  // Provider switching
  setProvider: (provider) => {
     if (!providers[provider]) {
       throw new Error(`Provider ${provider} not found`);
     }
     return providers[provider];
   },

   // Get home data (uses default provider)
   getHome: async () => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getHome) {
       throw new Error('Default provider does not support getHome');
     }
     return defaultProvider.getHome();
   },

   // Home data for Samehadaku
   getHomeSamehadaku: async () => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getHome) {
       throw new Error('Samehadaku provider does not support getHome');
     }
     return providerAPI.getHome();
   },

   // Home data for Stream (Anime Indo) using latest endpoint
   getHomeStream: async () => {
     const providerAPI = providers.stream;
     if (!providerAPI?.getLatest) {
       throw new Error('Stream provider does not support getLatest');
     }
     return providerAPI.getLatest();
   },

   // Get anime detail (uses default provider)
   getAnimeDetail: async (slug) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getAnimeDetail) {
       throw new Error('Default provider does not support getAnimeDetail');
     }
     return defaultProvider.getAnimeDetail(slug);
   },

   // Samehadaku anime detail
   getAnimeDetailSamehadaku: async (animeId) => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getAnimeDetail) {
       throw new Error('Samehadaku provider does not support getAnimeDetail');
     }
     return providerAPI.getAnimeDetail(animeId);
   },

   // Stream anime detail
   getAnimeDetailStream: async (slug) => {
     const providerAPI = providers.stream;
     if (!providerAPI?.getAnimeDetail) {
       throw new Error('Stream provider does not support getAnimeDetail');
     }
     return providerAPI.getAnimeDetail(slug);
   },

   // Get episode detail (uses default provider)
   getEpisodeDetail: async (slug) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getEpisodeDetail) {
       throw new Error('Default provider does not support getEpisodeDetail');
     }
     return defaultProvider.getEpisodeDetail(slug);
   },

   // Samehadaku episode detail
   getEpisodeDetailSamehadaku: async (episodeId) => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getEpisodeDetail) {
       throw new Error('Samehadaku provider does not support getEpisodeDetail');
     }
     return providerAPI.getEpisodeDetail(episodeId);
   },

   // Stream episode detail
   getEpisodeDetailStream: async (slug) => {
     const providerAPI = providers.stream;
     if (!providerAPI?.getEpisodeDetail) {
       throw new Error('Stream provider does not support getEpisodeDetail');
     }
     return providerAPI.getEpisodeDetail(slug);
   },

   // Get streaming server URL (uses default provider)
   getStreamingServer: async (serverId) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getStreamingServer) {
       throw new Error('Default provider does not support getStreamingServer');
     }
     return defaultProvider.getStreamingServer(serverId);
   },

   // Samehadaku streaming server
   getStreamingServerSamehadaku: async (serverId) => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getStreamingServer) {
       throw new Error('Samehadaku provider does not support getStreamingServer');
     }
     return providerAPI.getStreamingServer(serverId);
   },

   // Get schedule (uses default provider)
   getSchedule: async () => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getSchedule) {
       throw new Error('Default provider does not support getSchedule');
     }
     return defaultProvider.getSchedule();
   },

   // Samehadaku schedule
   getScheduleSamehadaku: async () => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getSchedule) {
       throw new Error('Samehadaku provider does not support getSchedule');
     }
     return providerAPI.getSchedule();
   },

   // Get batch download (uses default provider)
   getBatch: async (slug) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getBatch) {
       throw new Error('Default provider does not support getBatch');
     }
     return defaultProvider.getBatch(slug);
   },

   // Samehadaku batch list and detail
   getBatchListSamehadaku: async () => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getBatchList) {
       throw new Error('Samehadaku provider does not support getBatchList');
     }
     return providerAPI.getBatchList();
   },

   getBatchDetailSamehadaku: async (batchId) => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getBatchDetail) {
       throw new Error('Samehadaku provider does not support getBatchDetail');
     }
     return providerAPI.getBatchDetail(batchId);
   },

   // Get unlimited list (A–Z style; uses default provider)
   getUnlimited: async () => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getUnlimited) {
       throw new Error('Default provider does not support getUnlimited');
     }
     return defaultProvider.getUnlimited();
   },

   // Search across active providers (Otakudesu + Samehadaku)
   searchAll: async (keyword) => {
     const searchResults = {};
     const providerKeys = ['otakudesu', 'samehadaku'];
     
     for (const providerKey of providerKeys) {
       try {
         const providerAPI = providers[providerKey];
         if (providerAPI.search) {
           const results = await providerAPI.search(keyword);
           
           // Check if results indicate "not found" in various formats
           const isNotFound = 
             // Format: { statusCode: 404, ... }
             (results?.statusCode === 404) ||
             // Format: { status: "error", ... }  
             (results?.status === 'error') ||
             // Empty animeList
             (Array.isArray(results?.animeList) && results.animeList.length === 0) ||
             (Array.isArray(results?.data?.animeList) && results.data.animeList.length === 0) ||
             // No data at all
             (!results?.animeList && !results?.data?.animeList && !results?.data);
           
           if (isNotFound) {
             searchResults[providerKey] = {
               data: {
                 animeList: [],
               },
             };
           } else {
             searchResults[providerKey] = results;
           }
         }
       } catch (error) {
         // Any error = treat as empty results for this provider
          devError(`Error searching in ${providerKey}:`, error.message);
         searchResults[providerKey] = {
           data: {
             animeList: [],
           },
         };
       }
     }
     
     return searchResults;
   },
   
   // Single provider search
   search: async (keyword, provider = 'otakudesu') => {
     const providerAPI = providers[provider];
     if (!providerAPI?.search) {
       throw new Error(`Provider ${provider} does not support search`);
     }
     return providerAPI.search(keyword);
   },
  
   // Cross-provider search with fallback
   searchWithFallback: async (keyword) => {
     const providersToSearch = ['otakudesu', 'anoboy', 'oploverz'];
     
     for (const provider of providersToSearch) {
       try {
         const providerAPI = providers[provider];
         if (providerAPI.search) {
           return await providerAPI.search(keyword);
         }
        } catch {
          devLog(`Search failed in ${provider}, trying next...`);
        }
     }
     
     throw new Error('No providers available for search');
   },
  
  // Get available providers (aktif di UI)
  getProviders: () => ['otakudesu', 'samehadaku'],
  
   // Check if provider exists
   hasProvider: (provider) => Object.prototype.hasOwnProperty.call(providers, provider),
  
   // Get provider info
   getProviderInfo: (provider) => {
     if (!providers[provider]) {
       throw new Error(`Provider ${provider} not found`);
     }
     return {
       name: provider,
       endpoints: Object.keys(providers[provider]),
       available: true,
     };
   },

   // Get ongoing anime (uses default provider)
   getOngoing: async (page = 1) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getOngoing) {
       throw new Error('Default provider does not support getOngoing');
     }
     return defaultProvider.getOngoing(page);
   },

   // Samehadaku ongoing list
   getOngoingSamehadaku: async () => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getOngoing) {
       throw new Error('Samehadaku provider does not support getOngoing');
     }
     return providerAPI.getOngoing();
   },

   // Get completed anime (uses default provider)
   getCompleted: async (page = 1) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getCompleted) {
       throw new Error('Default provider does not support getCompleted');
     }
     return defaultProvider.getCompleted(page);
   },

   // Samehadaku completed list
   getCompletedSamehadaku: async () => {
     const providerAPI = providers.samehadaku;
     if (!providerAPI?.getCompleted) {
       throw new Error('Samehadaku provider does not support getCompleted');
     }
     return providerAPI.getCompleted();
   },

  // Samehadaku full A-Z style list
  getListSamehadaku: async () => {
    const providerAPI = providers.samehadaku;
    if (!providerAPI?.getList) {
      throw new Error('Samehadaku provider does not support list');
    }
    return providerAPI.getList();
  },

   // Get all genres
   getGenres: async (provider = 'otakudesu') => {
     const providerAPI = providers[provider];
     if (!providerAPI?.getGenres) {
       throw new Error(`Provider ${provider} does not support genres`);
     }
     return providerAPI.getGenres();
   },

   // Get anime by genre
   getAnimeByGenre: async (slug, provider = 'otakudesu') => {
     const providerAPI = providers[provider];
     if (!providerAPI?.getGenreAnime) {
       throw new Error(`Provider ${provider} does not support genre filtering`);
     }
     return providerAPI.getGenreAnime(slug);
   },

// Get A-Z list (uses providers that support it)
  getAZList: async (letter = null, provider = 'anoboy') => {
    const providerAPI = providers[provider];
    if (!providerAPI?.getAZList) {
      throw new Error(`Provider ${provider} does not support A-Z listing`);
    }
    
    try {
      if (letter) {
        // For providers that need a letter parameter (donghua)
        const data = await providerAPI.getAZList(letter);
        return data;
      }
      return await providerAPI.getAZList();
    } catch (error) {
      devError(`Failed to fetch A-Z list from ${provider}:`, error);
      throw error;
    }
  },
  
// Enhanced error handling with retry
  fetchWithRetry: async (endpoint, provider = 'default', retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetchAnime(endpoint, provider);
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        devLog(`Retry ${i + 1} for ${endpoint}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
    // Batch requests
    ,
    batchFetch: async (requests) => {
      const results = {};
      const promises = requests.map(({ endpoint, provider = 'default', key }) => fetchAnime(endpoint, provider).then(data => ({ key, data })));
      
      const resolved = await Promise.allSettled(promises);
      resolved.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results[requests[index].key] = result.value.data;
        } else {
          results[requests[index].key] = { error: result.reason.message };
        }
      });
      
      return results;
    },

  // ========== DONGHUA API ==========
  
  // Get Donghua home page
  getDonghuaHome: async (page = 1) => {
    return fetchAnime(`/donghua/home/${page}`, 'donghua');
  },

  // Get Donghua ongoing
  getDonghuaOngoing: async (page = 1) => {
    return fetchAnime(`/donghua/ongoing/${page}`, 'donghua');
  },

  // Get Donghua completed
  getDonghuaCompleted: async (page = 1) => {
    return fetchAnime(`/donghua/completed/${page}`, 'donghua');
  },

  // Get Donghua latest
  getDonghuaLatest: async (page = 1) => {
    return fetchAnime(`/donghua/latest/${page}`, 'donghua');
  },

  // Get Donghua schedule
  getDonghuaSchedule: async () => {
    return fetchAnime('/donghua/schedule', 'donghua');
  },

  // Search Donghua
  searchDonghua: async (keyword) => {
    return fetchAnime(`/donghua/search/${encodeURIComponent(keyword)}`, 'donghua');
  },

  // Get Donghua detail
  getDonghuaDetail: async (slug) => {
    return fetchAnime(`/donghua/detail/${slug}`, 'donghua');
  },

  // Get Donghua episode
  getDonghuaEpisode: async (slug) => {
    return fetchAnime(`/donghua/episode/${slug}`, 'donghua', { priority: true });
  },

  // Get Donghua genres
  getDonghuaGenres: async () => {
    return fetchAnime('/donghua/genres', 'donghua');
  },

  // Get Donghua by genre
  getDonghuaByGenre: async (slug, page = 1) => {
    return fetchAnime(`/donghua/genres/${slug}/${page}`, 'donghua');
  },

  // Get Donghua A-Z list
  getDonghuaAZList: async (letter, page = 1) => {
    return fetchAnime(`/donghua/az-list/${letter}/${page}`, 'donghua');
  },

  // Get Donghua by season/year
  getDonghuaBySeason: async (year) => {
    return fetchAnime(`/donghua/seasons/${year}`, 'donghua');
  },

};