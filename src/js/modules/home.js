import { api } from '../api/client.js';
import { categories } from '../config.js';
import { byId, element } from '../utils/dom.js';
import { plainText } from '../utils/sanitize.js';
import { createCategorySection } from './categories.js';
import { renderCards } from './movies.js';
import { playTrailer } from './trailers.js';

let heroMovies = [];
let heroIndex = 0;
let heroTimer;
let heroSwapTimer;
let heroVideos = new Map();
let ambientPaused = false;
let heroVisible = true;
let particleState = { canvas: null, ctx: null, particles: [], frame: null };
const genreNames = new Map();
const imageBase = 'https://image.tmdb.org/t/p/w1280';

function setHero(index) {
  if (!heroMovies.length) return;
  heroIndex = (index + heroMovies.length) % heroMovies.length;
  const movie = heroMovies[heroIndex];
  byId('hero-content').classList.remove('visible');
  clearTimeout(heroSwapTimer);
  heroSwapTimer = setTimeout(() => {
    byId('hero-title').textContent = plainText(movie.title || movie.name, 240);
    byId('hero-overview').textContent = plainText(movie.overview, 700);
    byId('hero-rating').textContent = `⭐ ${Number(movie.vote_average || 0).toFixed(1)}`;
    byId('hero-genre').textContent = (movie.genre_ids || []).map(id => genreNames.get(id)).filter(Boolean).slice(0, 2).join(' • ');
    byId('hero-img').src = movie.backdrop_path ? `${imageBase}${movie.backdrop_path}` : '';
    byId('btn-watch-hero').dataset.movieId = movie.id;
    byId('btn-trailer-hero').dataset.movieId = movie.id;
    byId('hero-content').classList.add('visible');
    byId('hero-indicators').querySelectorAll('button').forEach((button, i) => button.classList.toggle('active', i === heroIndex));
    displayHeroVideo(movie.id);
    loadHeroVideo(movie);
  }, 250);
}
function displayHeroVideo(movieId) {
  const frame = heroVideos.get(movieId);
  const container = byId('hero-video-container');
  container.replaceChildren();
  if (!frame) return;
  const iframe = element('iframe'); iframe.title = 'Trailer'; iframe.src = frame; iframe.allow = 'autoplay; encrypted-media';
  iframe.onload = () => { iframe.style.opacity = '1'; };
  container.append(iframe);
}
const heroVideoRequested = new Set();
async function loadHeroVideo(movie) {
  if (heroVideoRequested.has(movie.id)) return;
  heroVideoRequested.add(movie.id);
  try {
    const videos = await api.videos(movie.id);
    const trailer = videos.results?.find(video => video.site === 'YouTube' && video.type === 'Trailer');
    if (trailer?.key && /^[A-Za-z0-9_-]{6,20}$/.test(trailer.key)) {
      heroVideos.set(movie.id, `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}`);
      if (!ambientPaused && heroMovies[heroIndex]?.id === movie.id) displayHeroVideo(movie.id);
    }
  } catch { /* The hero still works with its backdrop when no trailer is available. */ }
}
function renderIndicators() {
  const host = byId('hero-indicators'); host.replaceChildren();
  heroMovies.forEach((movie, i) => {
    const button = element('button'); button.type = 'button'; button.setAttribute('aria-label', `Tampilkan ${plainText(movie.title || movie.name, 80)}`);
    button.addEventListener('click', () => { clearInterval(heroTimer); setHero(i); heroTimer = setInterval(() => setHero(heroIndex + 1), 10000); });
    host.append(button);
  });
}
async function initHero(trendingPromise) {
  try {
    const data = await trendingPromise; heroMovies = (data.results || []).slice(0, 5);
    if (!heroMovies.length) throw new Error('Film unggulan belum tersedia.');
    renderIndicators(); setHero(0); heroTimer = setInterval(() => setHero(heroIndex + 1), 10000);
  } catch (error) { byId('hero-title').textContent = 'Konten belum tersedia'; byId('hero-overview').textContent = error.message; }
}
async function initRows(trendingPromise) {
  const container = byId('movies-container');
  const plans = categories.map(category => ({ ...category, load: category.id === 'trending' ? trendingPromise : category.genre ? api.discover(category.genre, 1, 'popularity.desc', category.mediaType) : api[category.fetch]() }));
  const slots = plans.map(plan => { const section = createCategorySection(plan); container.append(section); return { plan, row: section.querySelector('[data-movie-row]') }; });
  await Promise.all(slots.map(async ({ plan, row }) => {
    try { const data = await plan.load; renderCards(row, data.results || [], { mediaType: plan.mediaType }); if (!row.children.length) row.append(element('p', 'search-message', 'Konten belum tersedia.')); }
    catch { row.replaceChildren(element('p', 'search-message', 'Gagal memuat konten. Coba lagi nanti.')); }
  }));
}
export async function initHome(genresPromise = api.genres()) {
  const trendingPromise = api.trendingMovies();
  await Promise.all([
    genresPromise.then(result => { for (const genre of result.genres || []) genreNames.set(genre.id, genre.name); }).catch(() => {}),
    initHero(trendingPromise),
    initRows(trendingPromise),
  ]);
}
export function initScrollEffects() {
  const navbar = byId('navbar'); const hero = byId('hero'); let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return; pending = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      navbar.classList.toggle('glass', y > 50);
      if (y < 800) { hero.style.transform = `scale(${Math.max(.9, 1 - y / 3000)}) translateY(${y * .15}px)`; byId('hero-content').style.opacity = String(Math.max(.25, 1 - y / 900)); }
      pending = false;
    });
  }, { passive: true });
}
export function initParticles() {
  const canvas = byId('particle-canvas'); const ctx = canvas.getContext('2d'); if (!ctx) return;
  particleState.canvas = canvas; particleState.ctx = ctx;
  const sync = () => {
    const shouldAnimate = heroVisible && !ambientPaused && document.visibilityState !== 'hidden' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldAnimate && particleState.frame === null) particleState.frame = requestAnimationFrame(animateParticles);
    if (!shouldAnimate && particleState.frame !== null) { cancelAnimationFrame(particleState.frame); particleState.frame = null; }
  };
  const resize = () => { const scale = Math.min(window.devicePixelRatio || 1, 2); canvas.width = canvas.clientWidth * scale; canvas.height = canvas.clientHeight * scale; ctx.setTransform(scale, 0, 0, scale, 0, 0); particleState.particles = Array.from({ length: innerWidth < 768 ? 24 : 60 }, () => ({ x: Math.random() * canvas.clientWidth, y: Math.random() * canvas.clientHeight, size: Math.random() * 2 + .5, speed: Math.random() * .4 + .1, opacity: Math.random() * .35 + .1 })); sync(); };
  addEventListener('resize', resize, { passive: true }); document.addEventListener('visibilitychange', sync);
  const observer = new IntersectionObserver(entries => { heroVisible = entries[0]?.isIntersecting ?? false; sync(); });
  observer.observe(byId('hero')); resize();
}
function animateParticles() {
  particleState.frame = null;
  if (!particleState.ctx || ambientPaused || !heroVisible || document.visibilityState === 'hidden') return;
  const { canvas, ctx, particles } = particleState;
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  for (const particle of particles) {
    particle.y -= particle.speed;
    if (particle.y < 0) { particle.y = canvas.clientHeight; particle.x = Math.random() * canvas.clientWidth; }
    ctx.fillStyle = `rgba(255,255,255,${particle.opacity})`; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
  }
  particleState.frame = requestAnimationFrame(animateParticles);
}
export function pauseAmbientEffects() {
  ambientPaused = true; clearInterval(heroTimer); heroTimer = null; clearTimeout(heroSwapTimer);
  if (particleState.frame !== null) { cancelAnimationFrame(particleState.frame); particleState.frame = null; }
  byId('hero-video-container')?.replaceChildren();
}
export function resumeAmbientEffects() {
  ambientPaused = false;
  if (heroMovies.length && !heroTimer) heroTimer = setInterval(() => setHero(heroIndex + 1), 10000);
  if (heroMovies.length) displayHeroVideo(heroMovies[heroIndex].id);
  if (particleState.ctx && heroVisible && document.visibilityState !== 'hidden' && !matchMedia('(prefers-reduced-motion: reduce)').matches && particleState.frame === null) particleState.frame = requestAnimationFrame(animateParticles);
}
export { playTrailer };
