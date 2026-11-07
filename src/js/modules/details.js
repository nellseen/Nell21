import { api } from '../api/client.js';
import { byId, element, safePoster } from '../utils/dom.js';
import { plainText } from '../utils/sanitize.js';
import { isMovieId, isTvEpisode } from '../utils/validators.js';
import { applySubtitleSettings, getSubtitleSettings, openPlayer, openTvPlayer, selectSubtitleTarget } from './player.js';
import { playTrailer } from './trailers.js';
import { hasSavedMedia, toggleWatchlist } from './watchlist.js';
import { setMediaOverlay } from '../utils/media-overlays.js';

let activeMedia = null;
let activeMediaType = 'movie';
let activeEpisodes = [];
let detailSequence = 0;
let previouslyFocused = null;
function openDetailShell() {
  const modal = byId('movieModal'); previouslyFocused = document.activeElement;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  setMediaOverlay('details', true);
  modal.querySelector('.detail-panel').focus();
}
function setDetailImage(path, alt, size = 'w500') {
  const poster = byId('detailPoster'); poster.src = safePoster(path, size); poster.alt = alt;
  poster.onerror = () => { poster.onerror = null; poster.src = 'https://placehold.co/500x750?text=No+Image'; };
}
function fillSeasons(show, sequence) {
  const select = byId('tvSeason'); select.replaceChildren();
  const seasons = (show.seasons || []).filter(season => Number.isInteger(Number(season.season_number)) && Number(season.season_number) >= 0);
  for (const season of seasons) {
    const option = element('option', '', `${season.name || `Season ${season.season_number}`}${season.episode_count ? ` · ${season.episode_count} eps` : ''}`);
    option.value = String(season.season_number); select.append(option);
  }
  const firstRegular = seasons.find(season => Number(season.season_number) > 0);
  if (firstRegular) select.value = String(firstRegular.season_number);
  if (select.value) loadSeasonEpisodes(sequence);
}
async function loadSeasonEpisodes(sequence = detailSequence) {
  if (!activeMedia || activeMediaType !== 'tv') return;
  const season = Number(byId('tvSeason').value);
  const showId = Number(activeMedia.id);
  const episodes = byId('tvEpisode'); episodes.replaceChildren(); activeEpisodes = []; byId('tvEpisodeOverview').textContent = '';
  byId('tvEpisodeWatch').disabled = true;
  if (!isTvEpisode(season, 1)) return;
  try {
    const data = await api.season(showId, season);
    if (sequence !== detailSequence || activeMediaType !== 'tv' || Number(activeMedia?.id) !== showId || Number(byId('tvSeason').value) !== season) return;
    activeEpisodes = data.episodes || [];
    for (const episode of activeEpisodes) {
      const number = Number(episode.episode_number);
      if (!Number.isInteger(number) || number < 1) continue;
      const option = element('option', '', `E${number}: ${plainText(episode.name, 120) || 'Episode'}`);
      option.value = String(number); episodes.append(option);
    }
    byId('tvEpisodeWatch').disabled = !episodes.value;
    if (episodes.value) { selectSubtitleTarget('tv', showId, season, Number(episodes.value)); updateEpisodeOverview(); }
  } catch { episodes.append(element('option', '', 'Daftar episode tidak tersedia')); }
}
function updateEpisodeOverview() {
  const episode = activeEpisodes.find(item => Number(item.episode_number) === Number(byId('tvEpisode').value));
  const overview = plainText(episode?.overview, 1500);
  byId('tvEpisodeOverview').textContent = overview || (episode ? 'Sinopsis episode belum tersedia.' : '');
}
function openMediaActions(mediaType) {
  byId('tvControls').hidden = mediaType !== 'tv';
  byId('detailWatch').hidden = mediaType !== 'movie';
  byId('detailTrailer').hidden = mediaType === 'person';
  byId('detailSave').hidden = mediaType === 'person';
  document.querySelector('.detail-subtitle').hidden = mediaType === 'person';
}
export async function showMovieDetails(mediaId, mediaType = 'movie') {
  if (!isMovieId(mediaId) || !['movie', 'tv'].includes(mediaType)) return;
  const sequence = ++detailSequence; activeMedia = null; activeMediaType = mediaType;
  selectSubtitleTarget(mediaType, mediaId, mediaType === 'tv' ? 1 : undefined, mediaType === 'tv' ? 1 : undefined);
  openDetailShell(); openMediaActions(mediaType);
  for (const button of ['detailWatch', 'detailTrailer', 'detailSave', 'tvEpisodeWatch']) byId(button).disabled = true;
  byId('detailTitle').textContent = `Memuat detail ${mediaType === 'tv' ? 'serial' : 'film'}…`;
  byId('detailOverview').textContent = ''; byId('detailMeta').textContent = ''; byId('detailGenres').textContent = '';
  try {
    const media = await api.details(mediaId, mediaType);
    if (sequence !== detailSequence) return;
    activeMedia = media;
    const title = plainText(media.title || media.name, 240) || 'Tanpa judul';
    byId('detailTitle').textContent = title;
    byId('detailOverview').textContent = plainText(media.overview, 3000) || 'Sinopsis belum tersedia.';
    const year = String(media.release_date || media.first_air_date || '').slice(0, 4);
    const runtime = Number(media.runtime || media.episode_run_time?.[0]);
    const rating = Number(media.vote_average);
    byId('detailMeta').textContent = [year, runtime > 0 ? `${runtime} menit/episode` : '', Number.isFinite(rating) && rating ? `⭐ ${rating.toFixed(1)}` : '', media.number_of_seasons ? `${media.number_of_seasons} season` : ''].filter(Boolean).join(' · ');
    byId('detailGenres').textContent = (media.genres || []).map(genre => plainText(genre.name, 80)).filter(Boolean).join(' · ');
    const backdrop = byId('detailBackdrop');
    if (media.backdrop_path) { backdrop.src = safePoster(media.backdrop_path, 'w1280'); backdrop.alt = `Latar ${title}`; } else { backdrop.removeAttribute('src'); backdrop.alt = ''; }
    setDetailImage(media.poster_path, `Poster ${title}`);
    for (const id of ['detailWatch', 'detailTrailer', 'detailSave']) byId(id).dataset.mediaId = String(media.id);
    const saved = hasSavedMedia(mediaType, media.id);
    byId('detailSave').textContent = saved ? '✓ Tersimpan' : '＋ My List';
    byId('detailSave').setAttribute('aria-pressed', String(saved));
    byId('detailWatch').disabled = false; byId('detailTrailer').disabled = false; byId('detailSave').disabled = false;
    if (mediaType === 'tv') fillSeasons(media, sequence);
  } catch (error) {
    if (sequence === detailSequence) { activeMedia = null; byId('detailTitle').textContent = 'Detail tidak tersedia'; byId('detailOverview').textContent = error.message || 'Coba lagi sebentar.'; }
  }
}
export async function showPersonDetails(personId) {
  if (!isMovieId(personId)) return;
  const sequence = ++detailSequence; activeMedia = null; activeMediaType = 'person';
  openDetailShell(); openMediaActions('person');
  for (const button of ['detailWatch', 'detailTrailer', 'detailSave', 'tvEpisodeWatch']) byId(button).disabled = true;
  byId('detailTitle').textContent = 'Memuat profil…'; byId('detailMeta').textContent = ''; byId('detailGenres').textContent = ''; byId('detailOverview').textContent = '';
  try {
    const person = await api.person(personId); if (sequence !== detailSequence) return;
    activeMedia = person;
    const name = plainText(person.name, 240) || 'Profil';
    byId('detailTitle').textContent = name;
    byId('detailMeta').textContent = [plainText(person.known_for_department, 100), person.birthday, plainText(person.place_of_birth, 180)].filter(Boolean).join(' · ');
    byId('detailOverview').textContent = plainText(person.biography, 3000) || 'Biografi belum tersedia.';
    const credits = [...(person.movie_credits?.cast || []), ...(person.tv_credits?.cast || [])].sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0)).slice(0, 5).map(item => plainText(item.title || item.name, 100));
    byId('detailGenres').textContent = credits.length ? `Dikenal melalui: ${credits.join(' · ')}` : '';
    const backdrop = byId('detailBackdrop'); backdrop.removeAttribute('src');
    setDetailImage(person.profile_path, `Foto ${name}`);
  } catch (error) { if (sequence === detailSequence) { byId('detailTitle').textContent = 'Profil tidak tersedia'; byId('detailOverview').textContent = error.message || ''; } }
}
export function closeDetails() {
  detailSequence++;
  const modal = byId('movieModal'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
  setMediaOverlay('details', false);
  document.body.style.overflow = '';
  if (previouslyFocused?.isConnected) previouslyFocused.focus();
}
export function bindDetailActions() {
  byId('tvSeason').addEventListener('change', () => loadSeasonEpisodes());
  byId('tvEpisode').addEventListener('change', () => {
    if (activeMedia) selectSubtitleTarget('tv', activeMedia.id, Number(byId('tvSeason').value), Number(byId('tvEpisode').value));
    updateEpisodeOverview();
    byId('tvEpisodeWatch').disabled = !byId('tvEpisode').value;
  });
  byId('tvEpisodeWatch').addEventListener('click', () => {
    if (!activeMedia || activeMediaType !== 'tv') return;
    const season = Number(byId('tvSeason').value); const episode = Number(byId('tvEpisode').value);
    if (!isTvEpisode(season, episode)) return;
    let settings = getSubtitleSettings();
    if (byId('detailSubtitleUrl').value.trim() || byId('detailSubtitleLabel').value.trim() || settings) {
      try { settings = applySubtitleSettings('detailSubtitleUrl', 'detailSubtitleLabel', 'detailSubtitleFeedback'); } catch { return; }
    }
    const showId = activeMedia.id; closeDetails(); openTvPlayer(showId, season, episode, settings);
  });
  byId('detailWatch').addEventListener('click', () => {
    if (!activeMedia || activeMediaType !== 'movie') return;
    const id = activeMedia.id;
    let settings = getSubtitleSettings();
    if (byId('detailSubtitleUrl').value.trim() || byId('detailSubtitleLabel').value.trim() || settings) {
      try { settings = applySubtitleSettings('detailSubtitleUrl', 'detailSubtitleLabel', 'detailSubtitleFeedback'); } catch { return; }
    }
    closeDetails(); openPlayer(id, settings);
  });
  byId('detailTrailer').addEventListener('click', async () => {
    if (!activeMedia || activeMediaType === 'person') return;
    const id = activeMedia.id; const mediaType = activeMediaType; closeDetails();
    try { await playTrailer(id, mediaType); } catch (error) { byId('page-message').textContent = error.message || 'Trailer tidak tersedia.'; }
  });
  byId('detailSave').addEventListener('click', () => {
    if (!activeMedia || activeMediaType === 'person') return;
    try {
      const saved = toggleWatchlist(activeMedia, activeMediaType);
      byId('detailSave').textContent = saved ? '✓ Tersimpan' : '＋ My List';
      byId('detailSave').setAttribute('aria-pressed', String(saved));
    } catch (error) { byId('detailGenres').textContent = error.message; }
  });
  byId('applyDetailSubtitle').addEventListener('click', () => { try { applySubtitleSettings('detailSubtitleUrl', 'detailSubtitleLabel', 'detailSubtitleFeedback'); } catch { /* Feedback is shown with the subtitle fields. */ } });
}
