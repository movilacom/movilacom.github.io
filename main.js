// main.js - MOVILA
const TMDB_KEY = "e2e0e3b90f9709c4bc6201c266a5dfb6";
const TMDB_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=en-US`;

// Helper: safe fetch with timeout
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

// ---------- MOVIES ----------
async function loadTrendingMovies(containerId = "moviesContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = Array.from({length:6}).map(_=> `<div class="card"><div class="skeleton" style="height:220px"></div><div class="meta"><div class="skeleton" style="height:16px;width:70%"></div><div style="height:8px"></div><div class="skeleton" style="height:12px;width:90%"></div></div></div>`).join("");
  const data = await safeFetch(TMDB_URL);
  if (!data || !data.results) {
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
        <button class="preview-btn" onclick="openPreview('<img src=&quot;${m.img}&quot; style=&quot;width:100%;border-radius:12px;&quot;><h3 style=&quot;color:var(--accent);margin:10px 0 4px&quot;>${escapeHtml(m.title)}</h3><p style=&quot;color:var(--muted)&quot;>${escapeHtml(m.overview)}</p>')">Preview</button>
      </div>
    </div>
  `;
}

// ---------- VIRAL (Reddit NSFW videos) ----------
async function loadViral(containerId = "viralContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="skeleton" style="height:160px;margin-bottom:12px"></div>`.repeat(3);

  // Fetch top posts from NSFW subreddit (Reddit public API)
  const REDDIT_URL = "https://www.reddit.com/r/NSFW_videos/top.json?limit=6&t=week";
  const data = await safeFetch(REDDIT_URL);

  if (!data || !data.data || !data.data.children) {
    container.innerHTML = getDummyViral().slice(0,4).map(v => renderVideo(v)).join("");
    return;
  }

  // Filter only posts that are video & NSFW
  const videos = data.data.children
    .filter(post => post.data.over_18 && post.data.is_video && post.data.media && post.data.media.reddit_video)
    .map(post => ({
      title: post.data.title,
      url: `https://reddit.com${post.data.permalink}`,
      img: post.data.thumbnail && post.data.thumbnail.startsWith('http') ? post.data.thumbnail : "assets/preview.jpg",
      source: "Reddit",
      videoUrl: post.data.media.reddit_video.fallback_url
    }));

  if (!videos.length) {
    container.innerHTML = getDummyViral().slice(0,4).map(v => renderVideo(v)).join("");
    return;
  }

  container.innerHTML = videos.map(v => renderVideo(v)).join("");
}

function renderVideo(v){
  // Jika ada videoUrl dari Reddit, embed video
  let previewHtml = v.videoUrl
    ? `<video src="${v.videoUrl}" controls autoplay style="width:100%;max-height:50vh;border-radius:12px"></video>`
    : `<img src="${v.img}" style="width:100%;border-radius:12px;">`;
  previewHtml += `<h3 style="color:var(--accent);margin:10px 0 4px">${escapeHtml(v.title)}</h3><p style="color:var(--muted)">${escapeHtml(v.source || "")}</p>`;

  return `
    <div class="video-card card">
      <img src="${v.img}" alt="${escapeHtml(v.title)}">
      <div class="meta">
        <h4>${escapeHtml(v.title)}</h4>
        <p style="color:var(--muted);font-size:0.85rem;margin-top:6px">${escapeHtml(v.source || "")}</p>
        <div style="margin-top:8px">
          <a href="${v.videoUrl || v.url || '#'}" target="_blank" style="color:var(--accent);text-decoration:none">Open →</a>
          <button class="preview-btn" onclick="openPreview(\`${previewHtml}\`)">Preview</button>
        </div>
      </div>
    </div>
  `;
}

// ---------- Popular picks (small demo) ----------
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

// ---------- Utilities & dummy data ----------
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

// ---------- Search ----------
function searchContent(){
  const q = document.getElementById("searchInput")?.value?.trim();
  if(!q) { alert("Please type a keyword to search"); return; }
  window.open(`https://www.google.com/search?q=${encodeURIComponent(q + " site:movilacom.pages.dev")}`, "_blank");
}

// ---------- Preview modal ----------
function openPreview(contentHtml) {
  document.getElementById('previewContent').innerHTML = contentHtml;
  document.getElementById('previewModal').style.display = 'flex';
}
function closePreview() {
  document.getElementById('previewModal').style.display = 'none';
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", ()=>{
  if(document.getElementById("moviesContainer")) loadTrendingMovies();
  if(document.getElementById("viralContainer")) loadViral();
  if(document.getElementById("popularContainer")) loadPopular();
});