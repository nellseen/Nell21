import { api } from '../api/client.js';
import { byId, element } from '../utils/dom.js';
import { renderCards } from './movies.js';

export function initInfiniteScroll() {
  const loader = byId('infinite-loader'); const container = byId('movies-container');
  let page = 1; let busy = false; let exhausted = false; let sectionIndex = 0;
  const observer = new IntersectionObserver(async entries => {
    if (!entries.some(entry => entry.isIntersecting) || busy || exhausted) return;
    busy = true; loader.classList.add('visible');
    try {
      const nextPage = page + 1; const data = await api.discover(undefined, nextPage);
      const movies = data.results || [];
      if (!movies.length || nextPage >= (Number(data.total_pages) || nextPage)) { exhausted = !movies.length || nextPage >= (Number(data.total_pages) || nextPage); }
      if (movies.length) {
        page = nextPage; sectionIndex++;
        const section = element('section', 'movie-section'); section.dataset.infiniteSection = String(sectionIndex);
        section.append(element('h3', '', `More Discoveries Page ${page}`));
        const row = element('div', 'movie-row'); row.dataset.movieRow = '';
        renderCards(row, movies); section.append(row); container.append(section);
      }
      if (exhausted) { loader.replaceChildren(element('span', 'page-message', 'Semua film sudah dimuat.')); observer.disconnect(); }
    } catch { byId('page-message').textContent = 'Gagal memuat halaman berikutnya. Gulir lagi untuk mencoba ulang.'; }
    finally { busy = false; loader.classList.remove('visible'); }
  }, { rootMargin: '250px' });
  observer.observe(loader);
}
