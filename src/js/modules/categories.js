import { element } from '../utils/dom.js';
import { categories } from '../config.js';

export function createCategorySection(category) {
  const section = element('section', 'movie-section');
  section.id = category.id;
  const title = element('h3', '', category.title);
  const row = element('div', 'movie-row');
  row.dataset.movieRow = '';
  row.dataset.mediaType = category.mediaType;
  row.setAttribute('aria-label', category.title);
  for (let i = 0; i < 7; i++) row.append(element('div', 'skeleton'));
  section.append(title, row);
  return section;
}
export const getCategories = () => categories;
