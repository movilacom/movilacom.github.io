// === MOVILA Main Script ===
// API Keys
const TMDB_KEY = "e2e0e3b90f9709c4bc6201c266a5dfb6";
const GNEWS_KEY = "dda11cfe0272244c8174dc3aa998156a";

// === Load Trending Movies ===
async function loadTrendingMovies() {
  const container = document.getElementById("movies-container");
  if (!container) return;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`);
    const data = await res.json();

    container.innerHTML = "";

    const movies = data.results.slice(0, 6); // ambil 6 film
    movies.forEach(movie => {
      const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "assets/placeholder.jpg";

      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <img src="${poster}" alt="${movie.title}">
        <h3>${movie.title}</h3>
        <p>${movie.overview ? movie.overview.slice(0, 100) + "..." : "No description available."}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    container.innerHTML = "<p class='error'>⚠️ Failed to load trending movies.</p>";
  }
}

// === Load Viral Videos / News ===
async function loadViralVideos() {
  const container = document.getElementById("viral-container");
  if (!container) return;

  try {
    const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=entertainment&lang=en&max=3&apikey=${GNEWS_KEY}`);
    const data = await res.json();

    container.innerHTML = "";

    const articles = data.articles || [];
    articles.forEach(article => {
      const card = document.createElement("div");
      card.classList.add("video-card");
      card.innerHTML = `
        <a href="${article.url}" target="_blank" class="video-link">
          <img src="${article.image || 'assets/placeholder.jpg'}" alt="${article.title}">
          <h4>${article.title}</h4>
        </a>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching viral videos:", error);
    container.innerHTML = "<p class='error'>⚠️ Failed to load viral videos.</p>";
  }
}

// === Run on Page Load ===
document.addEventListener("DOMContentLoaded", () => {
  loadTrendingMovies();
  loadViralVideos();
});