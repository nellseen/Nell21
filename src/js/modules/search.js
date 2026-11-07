import { api } from '../api/client.js';
import { byId, element, safePoster } from '../utils/dom.js';
import { plainText } from '../utils/sanitize.js';

export function initSearch() {
  const input = byId('searchInput'); const box = byId('searchResults');
  let timer; let controller; let activeQuery = '';
  input.addEventListener('input', () => {
    clearTimeout(timer); controller?.abort();
    const query = input.value.trim(); activeQuery = query;
    box.replaceChildren();
    if (query.length < 2) return;
    box.append(element('p', 'search-message', 'Mencari…'));
    timer = setTimeout(async () => {
      controller = new AbortController();
      try {
        const result = await api.search(query, controller.signal);
        if (activeQuery !== query) return;
        box.replaceChildren();
        const results = (result.results || []).filter(item => Number.isSafeInteger(Number(item.id)) && Number(item.id) > 0 && ['movie', 'tv', 'person'].includes(item.media_type)).slice(0, 8);
        if (!results.length) box.append(element('p', 'search-message', 'Tidak ditemukan.'));
        for (const item of results) {
          const button = element('button', 'search-result'); button.type = 'button';
          if (item.media_type === 'person') button.dataset.personId = String(Number(item.id));
          else { button.dataset.movieId = String(Number(item.id)); button.dataset.mediaType = item.media_type; }
          const image = element('img'); image.src = safePoster(item.poster_path || item.profile_path, 'w92'); image.alt = ''; image.loading = 'lazy';
          const text = element('span'); text.append(element('strong', '', plainText(item.title || item.name, 160) || 'Untitled'));
          const date = item.release_date || item.first_air_date;
          const kind = item.media_type === 'tv' ? 'Serial' : item.media_type === 'person' ? plainText(item.known_for_department, 50) || 'Orang' : 'Film';
          text.append(element('small', '', [kind, typeof date === 'string' ? date.slice(0, 4) : ''].filter(Boolean).join(' · ')));
          button.append(image, text); box.append(button);
        }
      } catch (error) { if (error.name !== 'AbortError' && activeQuery === query) { box.replaceChildren(element('p', 'search-message', 'Pencarian gagal. Coba lagi.')); } }
    }, 350);
  });
}
