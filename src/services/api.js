const API_BASE_URL = 'https://www.sankavollerei.com/anime';
const cache = new Map();
const rateLimitMap = new Map();

// Cache implementation
const getFromCache = (url) => cache.get(url);
const setCache = (url, data) => {
  cache.set(url, data);
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(url), 5 * 60 * 1000);
};

// Rate limiting implementation (50 requests per minute)
const isRateLimited = (url) => {
  const now = Date.now();
  const requests = rateLimitMap.get(url) || [];
  
  // Remove requests older than 1 minute
  const validRequests = requests.filter(timestamp => now - timestamp < 60000);
  
  // If we have 50+ requests in the last minute, rate limit
  if (validRequests.length >= 50) {
    return true;
  }
  
  // Add current request and update map
  validRequests.push(now);
  rateLimitMap.set(url, validRequests);
  return false;
};

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
  
  console.error('API Error:', errorData);
  
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

// Rate limiting utility
export const clearRateLimit = (url) => {
  rateLimitMap.delete(url);
};

// Cache management
export const clearCache = () => {
  cache.clear();
};

export const getCacheSize = () => cache.size;

export const getCacheKeys = () => Array.from(cache.keys());

// Clear cache for specific pattern
export const clearCachePattern = (pattern) => {
  const keys = Array.from(cache.keys()).filter(key => pattern.test(key));
  keys.forEach(key => cache.delete(key));
};

// Enhanced API fetching with caching and rate limiting
const fetchAnime = async (endpoint, provider = 'default') => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check cache first (skip rate limiting for cached data)
  const cachedData = getFromCache(url);
  if (cachedData) {
    console.log(`[${provider}] Using cached data for:`, url);
    return cachedData;
  }

  // Check rate limiting (only for actual network requests)
  if (isRateLimited(url)) {
    throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
  }

  try {
    console.log(`[${provider}] Fetching:`, url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${provider}] API Error ${response.status}:`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    setCache(url, data);
    return data;
  } catch (error) {
    console.error(`[${provider}] API fetch error for ${url}:`, error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    throw error;
  }
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
    getEpisodeDetail: (slug) => fetchAnime(`/episode/${slug}`, 'otakudesu'),
    getStreamingServer: (serverId) => fetchAnime(`/server/${serverId}`, 'otakudesu'),
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
    getGenres: () => fetchAnime('/samehadaku/genres', 'samehadaku'),
    getGenreAnime: (genreId) => fetchAnime(`/samehadaku/genres/${genreId}`, 'samehadaku'),
    search: (keyword) => fetchAnime(`/samehadaku/search/${encodeURIComponent(keyword)}`, 'samehadaku'),
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
    getOngoing: () => fetchAnime('/stream/ongoing', 'stream'),
    getCompleted: () => fetchAnime('/stream/completed', 'stream'),
    getGenres: () => fetchAnime('/stream/genres', 'stream'),
    getGenreAnime: (slug) => fetchAnime(`/stream/genres/${slug}`, 'stream'),
    search: (keyword) => fetchAnime(`/stream/search/${encodeURIComponent(keyword)}`, 'stream'),
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

   // Get anime detail (uses default provider)
   getAnimeDetail: async (slug) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getAnimeDetail) {
       throw new Error('Default provider does not support getAnimeDetail');
     }
     return defaultProvider.getAnimeDetail(slug);
   },

   // Get episode detail (uses default provider)
   getEpisodeDetail: async (slug) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getEpisodeDetail) {
       throw new Error('Default provider does not support getEpisodeDetail');
     }
     return defaultProvider.getEpisodeDetail(slug);
   },

   // Get streaming server URL (uses default provider)
   getStreamingServer: async (serverId) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getStreamingServer) {
       throw new Error('Default provider does not support getStreamingServer');
     }
     return defaultProvider.getStreamingServer(serverId);
   },

   // Get schedule (uses default provider)
   getSchedule: async () => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getSchedule) {
       throw new Error('Default provider does not support getSchedule');
     }
     return defaultProvider.getSchedule();
   },

   // Get batch download (uses default provider)
   getBatch: async (slug) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getBatch) {
       throw new Error('Default provider does not support getBatch');
     }
     return defaultProvider.getBatch(slug);
   },

   // Get unlimited list (A–Z style; uses default provider)
   getUnlimited: async () => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getUnlimited) {
       throw new Error('Default provider does not support getUnlimited');
     }
     return defaultProvider.getUnlimited();
   },

   // Search across all providers
   searchAll: async (keyword) => {
     const searchResults = {};
     const providerKeys = Object.keys(providers);
     
     for (const providerKey of providerKeys) {
       try {
         const providerAPI = providers[providerKey];
         if (providerAPI.search) {
           const results = await providerAPI.search(keyword);
           searchResults[providerKey] = results;
         }
       } catch (error) {
         console.error(`Error searching in ${providerKey}:`, error.message);
         searchResults[providerKey] = { error: error.message };
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
       } catch (e) {
         console.log(`Search failed in ${provider}, trying next...`);
       }
     }
     
     throw new Error('No providers available for search');
   },
  
   // Get available providers
   getProviders: () => Object.keys(providers),
  
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

   // Get completed anime (uses default provider)
   getCompleted: async (page = 1) => {
     const defaultProvider = providers.otakudesu;
     if (!defaultProvider?.getCompleted) {
       throw new Error('Default provider does not support getCompleted');
     }
     return defaultProvider.getCompleted(page);
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
      console.error(`Failed to fetch A-Z list from ${provider}:`, error);
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
        console.log(`Retry ${i + 1} for ${endpoint}...`);
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
};