import test from 'node:test';
import assert from 'node:assert/strict';
import { moviePlayerUrl, tvPlayerUrl, validateSubtitleInput } from '../modules/player.js';
import { plainText, youtubeEmbed } from '../utils/sanitize.js';
import { isMovieId } from '../utils/validators.js';

test('VidLink URL accepts only positive integer TMDB movie ids and documented options', () => {
  assert.equal(moviePlayerUrl(786892), 'https://vidlink.pro/movie/786892?primaryColor=007AFF&secondaryColor=1D1D1F&iconColor=FFFFFF&icons=default&title=true&poster=true&autoplay=false');
  assert.throws(() => moviePlayerUrl('1/2'), /ID film tidak valid/);
  assert.throws(() => moviePlayerUrl(-1), /ID film tidak valid/);
  assert.equal(isMovieId(Number.MAX_SAFE_INTEGER + 1), false);
});

test('VidLink TV URL requires a valid season and episode', () => {
  assert.equal(tvPlayerUrl(296206, 1, 1), 'https://vidlink.pro/tv/296206/1/1?primaryColor=007AFF&secondaryColor=1D1D1F&iconColor=FFFFFF&icons=default&title=true&poster=true&autoplay=false');
  assert.throws(() => tvPlayerUrl(296206, -1, 1), /season/i);
  assert.throws(() => tvPlayerUrl(296206, 1, 0), /season/i);
});

test('untrusted metadata stays plain text and YouTube keys are validated', () => {
  assert.equal(plainText('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
  assert.equal(youtubeEmbed('aB_cD-12345'), 'https://www.youtube-nocookie.com/embed/aB_cD-12345');
  assert.equal(youtubeEmbed('javascript:alert(1)'), null);
});

test('subtitle links must be direct HTTPS VTT URLs', () => {
  assert.deepEqual(validateSubtitleInput('https://cdn.example/subs/id.vtt?sig=abc', 'Bahasa Indonesia'), { file: 'https://cdn.example/subs/id.vtt?sig=abc', label: 'Bahasa Indonesia' });
  assert.throws(() => validateSubtitleInput('http://cdn.example/id.vtt'), /HTTPS/);
  assert.throws(() => validateSubtitleInput('https://cdn.example/id.srt'), /HTTPS/);
  assert.throws(() => validateSubtitleInput('https://user:pass@cdn.example/id.vtt'), /HTTPS/);
  assert.equal(moviePlayerUrl(786892, validateSubtitleInput('https://cdn.example/id.vtt', 'ID')).includes('sub_file=https%3A%2F%2Fcdn.example%2Fid.vtt'), true);
});
