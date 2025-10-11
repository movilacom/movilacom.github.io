/* main.js - MOVILA final
   - TMDB trending movies
   - GNews fallback for viral if reddit blocked
   - Reddit public JSON integration (filters out over_18 automatically)
   - Uses safeFetch with timeout
*/

// === CONFIG - replace keys if needed ===
const TMDB_KEY = "e2e0e3b90f9709c4bc6201c266a5dfb6"; // your TMDB v3 key
const GNEWS_KEY = "dda11cfe0272244c8174dc3aa998156a"; // your GNews key

const TMDB_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=en-US`;
const GNEWS_URL = `https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&country=us&max=6&apikey=${GNEWS_KEY}`;

// If you deploy a Cloudflare Worker proxy, add its URL here (e.g. "https://your-worker.workers.dev/?target=")
const REDDIT_PROXY = ""; // leave empty to try direct Reddit public JSON (may be blocked by CORS)

// subreddits to query (public)
const REDDIT_SUBS = ["movies","entertainment","videos","documentaries","PopCulture"];

async function safeFetch(url, timeout = 9000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error("Fetch failed: " + res.status);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    console.warn("safeFetch error:", err);
    return null;
  }
}

/* --------- RENDER HELPERS ---------- */
function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function truncate(s,n){ if(!s) return ""; return s.length>n? s.slice(0,n).trim()+"...": s; }

function renderMovieCard(m){
  return `
    <div class="card fade-in">
      <img src="${m.img}" alt="${escapeHtml(m.title)}">
      <div class="meta">
        <h4>${escapeHtml(m.title)}</h4>
        <p>${escapeHtml(truncate(m.overview || "No description available.", 110))}</p>
      </div>
    </div>
  `;
}

function renderVideoCard(v){
  return `
    <div class="video-card card fade-in">
      <img src="${v.img}" alt="${escapeHtml(v.title)}">
      <div class="meta">
        <h4>${escapeHtml(v.title)}</h4>
        <p style="color:var(--muted);font-size:0.85rem">${escapeHtml(v.source || "")}</p>
        <div style="margin-top:8px"><a href="${v.url || '#'}" target="_blank" style="color:var(--accent);text-decoration:none">Open →</a></div>
      </div>
    </div>
  `;
}

/* ---------- DUMMY FALLBACKS ---------- */
function getDummyMovies(){
  return [
    { title:"Dune: Part Two", overview:"Paul Atreides continues his journey across the deserts of Arrakis...", img:"https://image.tmdb.org/t/p/w500/8bcoRX3hQRHufLPSDREdvr3YMXx.jpg" },
    { title:"Joker: Folie à Deux", overview:"Arthur Fleck returns...", img:"https://image.tmdb.org/t/p/w500/6tPqXlW8R7iVQm6r6tKp4sF1HZz.jpg" },
    { title:"Deadpool & Wolverine", overview:"The chaotic duo team up for an unexpected adventure...", img:"https://image.tmdb.org/t/p/w500/f3hEMr4P1q3gVJX2n5WvUj6zV8l.jpg" },
    { title:"Indie Spotlight: Ocean Blue", overview:"A heartfelt indie about reconnecting with family and sea...", img:"assets/preview.jpg" },
    { title:"The Last Frontier", overview:"A thrilling survival drama set on the icy frontier...", img:"assets/preview.jpg" },
    { title:"Midnight Echoes", overview:"A moody psychological drama about choices and memory...", img:"assets/preview.jpg" }
  ];
}
function getDummyViral(){
  return [
    { title:"Viral Clip: Surprise Concert", img:"assets/preview.jpg", url:"#", source:"YouTube" },
    { title:"TikTok Dance Trend 2025", img:"assets/preview.jpg", url:"#", source:"TikTok" },
    { title:"Celebrity Interview Clip", img:"assets/preview.jpg", url:"#", source:"Instagram" },
    { title:"Funny Pet Compilation", img:"assets/preview.jpg", url:"#", source:"Reddit" }
  ];
}

/* ---------- MOVIES: fetch TMDB ---------- */
async function loadTrendingMovies(containerId = "moviesContainer", limit=6){
  const container = document.getElementById(containerId);
  if (!container) return;
  // skeleton
  container.innerHTML = Array.from({length:6}).map(_=> `<div class="card"><div class="skeleton" style="height:220px"></div><div class="meta"><div class="skeleton" style="height:16px;width:70%"></div><div style="height:8px"></div><div class="skeleton" style="height:12px;width:90%"></div></div></div>`).join("");
  const data = await safeFetch(TMDB_URL);
  if (!data || !data.results) {
    const dummy = getDummyMovies().slice(0,limit);
    container.innerHTML = dummy.map(m=>renderMovieCard(m)).join("");
    // add visible class after slight delay
    requestAnimationFrame(()=> setTimeout(()=> document.querySelectorAll('.fade-in').forEach(el=>el.classList.add('visible')),80));
    return;
  }
  const movies = data.results.slice(0,limit).map(m => ({
    title: m.title || m.name,
    overview: m.overview,
    img: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "assets/preview.jpg"
  }));
  container.innerHTML = movies.map(renderMovieCard).join("");
  requestAnimationFrame(()=> setTimeout(()=> document.querySelectorAll('.fade-in').forEach(el=>el.classList.add('visible')),80));
}

/* ---------- REDDIT: public JSON (no auth) with NSFW filter ---------- */
async function fetchRedditSubRaw(sub, limit=8){
  // build target url
  const target = `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`;
  const url = REDDIT_PROXY ? (REDDIT_PROXY + encodeURIComponent(target)) : target;
  return await safeFetch(url);
}

async function loadRedditViral(containerId = "viralContainer"){
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="skeleton" style="height:160px;margin-bottom:12px"></div>`.repeat(3);
  let all = [];
  for (let sub of REDDIT_SUBS){
    const json = await fetchRedditSubRaw(sub, 8);
    if (json === null){
      // likely CORS or network issue -> fallback to GNews later
      all = null;
      break;
    }
    const posts = (json.data && json.data.children) ? json.data.children.map(c=>c.data) : [];
    // filter out NSFW (over_18 true) — IMPORTANT: we DO NOT display NSFW
    const safe = posts.filter(p => !p.over_18 && ( (p.thumbnail && p.thumbnail.startsWith("http")) || (p.preview && p.preview.images && p.preview.images.length) || p.media ));
    const mapped = safe.map(p => ({
      title: p.title,
      url: p.url || `https://reddit.com${p.permalink}`,
      img: (p.preview && p.preview.images && p.preview.images[0] && p.preview.images[0].source && p.preview.images[0].source.url) ? p.preview.images[0].source.url.replace(/&amp;/g,'&') : (p.thumbnail && p.thumbnail.startsWith("http") ? p.thumbnail : null),
      source: `r/${p.subreddit}`
    }));
    all = all.concat(mapped);
    if (all.length >= 8) break;
  }

  if (all === null || all.length === 0){
    // fallback: use GNews or dummy
    const g = await safeFetch(GNEWS_URL);
    if (g && g.articles && g.articles.length){
      container.innerHTML = g.articles.slice(0,6).map(a => renderVideoCard({ title: a.title, img: a.image || 'assets/preview.jpg', url: a.url, source: a.source.name })).join("");
    } else {
      container.innerHTML = getDummyViral().slice(0,6).map(v=>renderVideoCard(v)).join("");
    }
    requestAnimationFrame(()=> setTimeout(()=> document.querySelectorAll('.fade-in').forEach(el=>el.classList.add('visible')),80));
    return;
  }

  // dedupe & limit
  const seen = new Set();
  const uniq = [];
  for (const it of all){
    if (!it || !it.url) continue;
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    uniq.push(it);
    if (uniq.length >= 6) break;
  }

  container.innerHTML = uniq.map(item => renderVideoCard(item)).join("");
  requestAnimationFrame(()=> setTimeout(()=> document.querySelectorAll('.fade-in').forEach(el=>el.classList.add('visible')),80));
}

/* ---------- POPULAR picks (dummy) ---------- */
function loadPopular(containerId = "popularContainer"){
  const container = document.getElementById(containerId);
  if (!container) return;
  const picks = getDummyMovies().slice(0,5);
  container.innerHTML = picks.map(p => `
    <div class="pop-item">
      <img src="${p.img}" alt="${escapeHtml(p.title)}" style="width:64px;height:56px;object-fit:cover;border-radius:8px" />
      <div>
        <div style="color:var(--accent);font-weight:600">${escapeHtml(p.title)}</div>
        <div style="font-size:12px;color:var(--muted)">${escapeHtml(truncate(p.overview,48))}</div>
      </div>
    </div>
  `).join("");
}

/* ---------- Search utility ---------- */
function searchContent(){
  const q = document.getElementById("searchInput")?.value?.trim();
  if(!q){ alert("Please type keyword"); return; }
  window.open(`https://www.google.com/search?q=${encodeURIComponent(q + " site:movilacom.pages.dev")}`, "_blank");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  loadTrendingMovies("moviesContainer",6);
  loadRedditViral("viralContainer");
  loadPopular("popularContainer");
});