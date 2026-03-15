# 🎬 Anime REST API Documentation

**Base URL**

    https://www.sankavollerei.com/anime/

------------------------------------------------------------------------

# ⚠️ API Rules

-   **Rate Limit:** 50 requests / minute
-   Use caching where possible
-   Avoid repeated unnecessary requests
-   Implement debounce for search
-   Prefer server-side fetching or caching layer

------------------------------------------------------------------------

# 📦 Otakudesu API

  Method   Endpoint                       Description
  -------- ------------------------------ --------------------------
  GET      /anime/home                    Data halaman utama
  GET      /anime/schedule                Jadwal rilis anime
  GET      /anime/ongoing-anime           Anime yang sedang tayang
  GET      /anime/complete-anime?page=1   Anime yang sudah tamat
  GET      /anime/genre                   Semua genre
  GET      /anime/genre/:slug             Anime berdasarkan genre
  GET      /anime/search/:keyword         Pencarian anime
  GET      /anime/anime/:slug             Detail anime
  GET      /anime/episode/:slug           Detail episode
  GET      /anime/server/:serverId        URL streaming server
  GET      /anime/batch/:slug             Download batch
  GET      /anime/unlimited               Semua anime

------------------------------------------------------------------------

# 🐉 Donghua API

  Method   Endpoint                             Description
  -------- ------------------------------------ ---------------------------
  GET      /anime/donghua/home/:page            Halaman utama Donghua
  GET      /anime/donghua/ongoing/:page         Donghua ongoing
  GET      /anime/donghua/completed/:page       Donghua completed
  GET      /anime/donghua/latest/:page          Donghua terbaru
  GET      /anime/donghua/schedule              Jadwal Donghua
  GET      /anime/donghua/az-list/:slug/:page   List A-Z
  GET      /anime/donghua/search/:keyword       Search Donghua
  GET      /anime/donghua/detail/:slug          Detail Donghua
  GET      /anime/donghua/episode/:slug         Detail episode
  GET      /anime/donghua/genres                Semua genre
  GET      /anime/donghua/genres/:slug/:page    Donghua per genre
  GET      /anime/donghua/seasons/:year         Donghua berdasarkan tahun

------------------------------------------------------------------------

# 🍥 Samehadaku API

  Method   Endpoint                               Description
  -------- -------------------------------------- ------------------
  GET      /anime/samehadaku/home                 Halaman utama
  GET      /anime/samehadaku/recent               Anime terbaru
  GET      /anime/samehadaku/search               Search anime
  GET      /anime/samehadaku/ongoing              Anime ongoing
  GET      /anime/samehadaku/completed            Anime completed
  GET      /anime/samehadaku/popular              Anime populer
  GET      /anime/samehadaku/movies               Anime movie
  GET      /anime/samehadaku/list                 List anime
  GET      /anime/samehadaku/schedule             Jadwal rilis
  GET      /anime/samehadaku/genres               List genre
  GET      /anime/samehadaku/genres/:genreId      Anime per genre
  GET      /anime/samehadaku/batch                Download batch
  GET      /anime/samehadaku/anime/:animeId       Detail anime
  GET      /anime/samehadaku/episode/:episodeId   Detail episode
  GET      /anime/samehadaku/server/:serverId     Server streaming

------------------------------------------------------------------------

# 🚀 Kusonime API

  Method   Endpoint                               Description
  -------- -------------------------------------- -------------------------
  GET      /anime/kusonime/latest                 Anime terbaru
  GET      /anime/kusonime/all-anime              Semua anime
  GET      /anime/kusonime/movie                  Anime movie
  GET      /anime/kusonime/type/:type             Filter berdasarkan type
  GET      /anime/kusonime/all-genres             Semua genre
  GET      /anime/kusonime/all-seasons            Semua musim
  GET      /anime/kusonime/search/:query          Search anime
  GET      /anime/kusonime/genre/:slug            Anime per genre
  GET      /anime/kusonime/season/:season/:year   Anime per musim
  GET      /anime/kusonime/detail/:slug           Detail anime

------------------------------------------------------------------------

# 👾 Anoboy API

  Method   Endpoint                        Description
  -------- ------------------------------- -----------------
  GET      /anime/anoboy/home              Halaman utama
  GET      /anime/anoboy/search/:keyword   Search anime
  GET      /anime/anoboy/anime/:slug       Detail anime
  GET      /anime/anoboy/episode/:slug     Detail episode
  GET      /anime/anoboy/az-list           List A-Z
  GET      /anime/anoboy/list              List anime
  GET      /anime/anoboy/genre/:slug       Anime per genre
  GET      /anime/anoboy/genres            Semua genre

------------------------------------------------------------------------

# 📺 Oploverz API

  Method   Endpoint                        Description
  -------- ------------------------------- -----------------
  GET      /anime/oploverz/home            Halaman utama
  GET      /anime/oploverz/schedule        Jadwal rilis
  GET      /anime/oploverz/ongoing         Anime ongoing
  GET      /anime/oploverz/completed       Anime completed
  GET      /anime/oploverz/list            List anime
  GET      /anime/oploverz/search/:query   Search anime
  GET      /anime/oploverz/anime/:slug     Detail anime
  GET      /anime/oploverz/episode/:slug   Detail episode

------------------------------------------------------------------------

# 🎥 Stream API (Anime Indo)

  Method   Endpoint                      Description
  -------- ----------------------------- -------------------
  GET      /anime/stream/latest          Episode terbaru
  GET      /anime/stream/popular         Anime populer
  GET      /anime/stream/search/:query   Search anime
  GET      /anime/stream/anime/:slug     Detail anime
  GET      /anime/stream/episode/:slug   Streaming episode
  GET      /anime/stream/movie           Anime movie
  GET      /anime/stream/list            List anime
  GET      /anime/stream/genres          List genre
  GET      /anime/stream/genres/:slug    Anime per genre

------------------------------------------------------------------------

# 🔍 Example Request

### Get Home Anime

    GET https://www.sankavollerei.com/anime/home

### Search Anime

    GET https://www.sankavollerei.com/anime/search/naruto

### Anime Detail

    GET https://www.sankavollerei.com/anime/anime/naruto

### Episode Stream

    GET https://www.sankavollerei.com/anime/episode/naruto-episode-1

------------------------------------------------------------------------

# 🧠 Best Practices

### Cache API

``` javascript
const cache = new Map()

async function fetchAnime(url){
 if(cache.has(url)) return cache.get(url)

 const res = await fetch(url)
 const data = await res.json()

 cache.set(url,data)
 return data
}
```

### Debounce Search

``` javascript
function debounce(fn,delay){
 let timeout
 return (...args)=>{
  clearTimeout(timeout)
  timeout=setTimeout(()=>fn(...args),delay)
 }
}
```
