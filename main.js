// main.js - MOVILA
// REPLACE these keys with your keys (do not commit private keys publicly if you want privacy)
const TMDB_KEY = "e2e0e3b90f9709c4bc6201c266a5dfb6"; // <- put your TMDB v3 key
const GNEWS_KEY = "dda11cfe0272244c8174dc3aa998156a"; // <- put your GNews key

const TMDB_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=en-US`;
const GNEWS_URL = `https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&country=us&max=6&apikey=${GNEWS_KEY}`;

// Helpers: safe fetch with timeout
async function safeFetch(url, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error("Network response not ok: " + res.status);
    return await res.json();
  } catch (e) {
    clearTimeout(id);
    console.error("safeFetch error:", e);
    return null;
  }
}

/* ---------- MOVIES ---------- */
async function loadTrendingMovies(containerId = "moviesContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;
  // show skeleton
  container.innerHTML = Array.from({length:6}).map(_=> `<div class="card"><div class="skeleton" style="height:220px"></div><div class="meta"><div class="skeleton" style="height:16px;width:70%"></div><div style="height:8px"></div><div class="skeleton" style="height:12px;width:90%"></div></div></div>`).join("");
  const data = await safeFetch(TMDB_URL);
  if (!data || !data.results) {
    // fallback dummy
    container.innerHTML = getDummyMovies().slice(0,6).map(m => renderCard(m)).join("");
    return;
  }
  container.innerHTML = data.results.slice(0,6).map(movie => {
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "assets/preview.jpg";
    return renderCard({ title: movie.title || movie.name, overview: movie.overview, img: poster });
  }).join("");
}

function renderCard(m){
  return `
    <div class="card">
      <img src="${m.img}" alt="${escapeHtml(m.title)}">
      <div class="meta">
        <h4>${escapeHtml(m.title)}</h4>
        <p>${escapeHtml(truncate(m.overview || "No description available.", 110))}</p>
      </div>
    </div>
  `;
}

/* ---------- VIRAL ---------- */
async function loadViral(containerId = "viralContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="skeleton" style="height:160px;margin-bottom:12px"></div>`.repeat(3);
  const data = await safeFetch(GNEWS_URL);
  if (!data || !data.articles) {
    container.innerHTML = getDummyViral().slice(0,4).map(v => renderVideo(v)).join("");
    return;
  }
  container.innerHTML = data.articles.slice(0,6).map(article => {
    return renderVideo({
      title: article.title,
      url: article.url,
      img: article.image || "assets/preview.jpg",
      source: article.source ? article.source.name : ""
    });
  }).join("");
}

function renderVideo(v){
  return `
    <div class="video-card card">
      <img src="${v.img}" alt="${escapeHtml(v.title)}">
      <div class="meta">
        <h4>${escapeHtml(v.title)}</h4>
        <p style="color:var(--muted);font-size:0.85rem;margin-top:6px">${escapeHtml(v.source || "")}</p>
        <div style="margin-top:8px"><a href="${v.url || '#'}" target="_blank" style="color:var(--accent);text-decoration:none">Open →</a></div>
      </div>
    </div>
  `;
}

/* ---------- Popular picks (small demo) ---------- */
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

/* ---------- Utilities & dummy data ---------- */
function truncate(s,n){ if(!s) return ""; return s.length>n? s.slice(0,n).trim()+"...": s }
function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;") }

function getDummyMovies(){
  return [
    { title:"Dune: Part Two", overview:"Paul Atreides continues his journey across the deserts of Arrakis...", img:"https://image.tmdb.org/t/p/w500/8bcoRX3hQRHufLPSDREdvr3YMXx.jpg" },
    { title:"Joker: Folie à Deux", overview:"Arthur Fleck returns in a twisted musical of chaos and love...", img:"https://image.tmdb.org/t/p/w500/6tPqXlW8R7iVQm6r6tKp4sF1HZz.jpg" },
    { title:"Deadpool & Wolverine", overview:"The chaotic duo team up for an unexpected adventure...", img:"https://image.tmdb.org/t/p/w500/f3hEMr4P1q3gVJX2n5WvUj6zV8l.jpg" },
    { title:"The Last Frontier", overview:"A thrilling survival drama set on the icy frontier...", img:"assets/preview.jpg" },
    { title:"The Woman in Cabin 10", overview:"A mystery-thriller about a journalist trapped in a nightmare...", img:"assets/preview.jpg" },
    { title:"Indie Spotlight: Ocean Blue", overview:"A heartfelt indie about reconnecting with family and sea...", img:"assets/preview.jpg" }
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

/* ---------- Search ---------- */
function searchContent(){
  const q = document.getElementById("searchInput")?.value?.trim();
  if(!q) { alert("Please type a keyword to search"); return; }
  // Quick search: open Google limited to site (simple approach)
  window.open(`https://www.google.com/search?q=${encodeURIComponent(q + " site:movilacom.pages.dev")}`, "_blank");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  loadTrendingMovies(); // homepage
  loadViral();          // homepage
  loadPopular();        // sidebar
});