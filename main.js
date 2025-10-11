// === MOVILA MAIN.JS ===
// Enhanced Edition ✨
// Author: Besti 💛 2025

const TMDB_API_KEY = "e2e0e3b90f9709c4bc6201c266a5dfb6";
const GNEWS_API_KEY = "dda11cfe0272244c8174dc3aa998156a";
const TMDB_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`;
const GNEWS_URL = `https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&country=us&max=9&apikey=${GNEWS_API_KEY}`;

// === LOADER ===
const loader = document.createElement("div");
loader.className = "loader";
loader.innerHTML = `<div class="spinner"></div><p>Loading MOVILA magic ✨</p>`;
document.body.appendChild(loader);

// === NAVBAR TOGGLE ===
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.querySelector(".nav");
if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });
}

// === FETCH MOVIES ===
async function fetchMovies() {
  try {
    const res = await fetch(TMDB_URL);
    const data = await res.json();
    const movies = data.results.slice(0, 9);

    const movieContainer = document.getElementById("movie-grid");
    if (!movieContainer) return;

    movieContainer.innerHTML = movies
      .map(
        (movie, i) => `
      <div class="card fade-in" style="animation-delay:${i * 0.1}s">
        <img data-src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="lazy">
        <div class="card-info">
          <h3>${movie.title}</h3>
          <p>${movie.overview.substring(0, 80)}...</p>
          <span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>
        </div>
      </div>`
      )
      .join("");
  } catch (err) {
    console.error("Movie fetch error:", err);
  }
}

// === FETCH VIRAL VIDEOS ===
async function fetchViralVideos() {
  try {
    const res = await fetch(GNEWS_URL);
    const data = await res.json();
    const articles = data.articles.slice(0, 9);

    const viralContainer = document.getElementById("viral-grid");
    if (!viralContainer) return;

    viralContainer.innerHTML = articles
      .map(
        (v, i) => `
      <div class="card fade-in" style="animation-delay:${i * 0.1}s">
        <img data-src="${v.image || 'assets/preview.jpg'}" alt="${v.title}" class="lazy">
        <div class="card-info">
          <h3>${v.title}</h3>
          <p>${v.description ? v.description.substring(0, 80) + "..." : "No description."}</p>
          <a href="${v.url}" target="_blank" class="watch-btn">▶ Watch</a>
        </div>
      </div>`
      )
      .join("");
  } catch (err) {
    console.error("Viral video fetch error:", err);
  }
}

// === SEARCH FEATURE ===
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      if (!query) return;

      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      const results = data.results.slice(0, 9);
      const movieContainer = document.getElementById("movie-grid");

      movieContainer.innerHTML = results
        .map(
          (movie) => `
          <div class="card fade-in">
            <img data-src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="lazy">
            <h3>${movie.title}</h3>
            <p>${movie.overview.substring(0, 90)}...</p>
            <span class="rating">⭐ ${movie.vote_average.toFixed(1)}</span>
          </div>`
        )
        .join("");

      lazyLoadImages();
    }
  });
}

// === SMOOTH SCROLL & ANIMATIONS ===
const faders = document.querySelectorAll(".fade-in");
const appearOptions = { threshold: 0.2 };

const appearOnScroll = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("appear");
    observer.unobserve(entry.target);
  });
}, appearOptions);

faders.forEach((fade) => appearOnScroll.observe(fade));

// === LAZY LOAD ===
function lazyLoadImages() {
  const lazyImages = document.querySelectorAll("img.lazy");
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute("data-src");
        img.classList.remove("lazy");
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach((img) => imageObserver.observe(img));
}

// === PAGE INIT ===
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([fetchMovies(), fetchViralVideos()]);
  setTimeout(() => {
    loader.classList.add("hide");
  }, 1000);
  lazyLoadImages();
});