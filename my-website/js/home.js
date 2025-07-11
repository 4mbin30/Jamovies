const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

// JavaScript for handling slider
let currentIndex = 0;
const slider = document.querySelector('#movies-list');

// Focus management for keyboard/remote navigation
let focusedIndex = 0;
const posters = document.querySelectorAll('.movie-poster');

window.addEventListener('load', () => {
  if (posters.length > 0) {
    posters[focusedIndex].focus(); // Focus on the first poster on page load
  }
});

// Update the existing `slideTo` function to work with focus as well
function slideTo(index) {
  const posters = document.querySelectorAll('.movie-poster');
  const totalPosts = posters.length;

  if (totalPosts === 0) return;

  if (index < 0) {
    focusedIndex = totalPosts - 1;
  } else if (index >= totalPosts) {
    focusedIndex = 0;
  } else {
    focusedIndex = index;
  }

  slider.style.transform = `translateX(-${focusedIndex * (posters[0].clientWidth + 10)}px)`;
  posters[focusedIndex].focus(); // Set focus to the current movie poster
}

// Auto slide every 3 seconds
setInterval(() => {
  slideTo(focusedIndex + 1);
}, 3000);

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    // Move right (next poster)
    if (focusedIndex < posters.length - 1) {
      focusedIndex++;
      posters[focusedIndex].focus();
    }
  } else if (event.key === 'ArrowLeft') {
    // Move left (previous poster)
    if (focusedIndex > 0) {
      focusedIndex--;
      posters[focusedIndex].focus();
    }
  } else if (event.key === 'Enter') {
    // On Enter key (or OK button on remote), open the movie details modal
    const selectedPoster = posters[focusedIndex];
    const selectedMovie = selectedPoster.querySelector('img');
    showDetails({ title: selectedMovie.alt, poster_path: selectedMovie.src });
  }
});

// Click event to slide to selected poster
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const movieDiv = document.createElement('div');
    movieDiv.classList.add('movie-poster');
    movieDiv.tabIndex = 0; // Make movie posters focusable

    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      showDetails(item);
      slideTo(items.indexOf(item)); // Slide to the selected poster
    };

    movieDiv.appendChild(img);
    container.appendChild(movieDiv);
  });
}

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];

  // Fetch from multiple pages to get more anime (max 3 pages for demo)
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }

  return allResults;
}

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  container.innerHTML = '';
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

init();
