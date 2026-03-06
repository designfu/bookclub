export function ensureGoodreadsUrlIsValid(url) {
  if(url.startsWith('goodreads.com')) {
    url = `www.${url}`;
  }
  if(url.startsWith('www.')) {
    url = `https://${url}`;
  }
  return url
}

export function ensureGoodreadsUrlIsShort(url) {
  if(!url) {
    return '';
  }

  const normalized = url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '');

  const parts = normalized.split('/');
  if(parts.length <= 2) {
    return normalized;
  }

  return `${parts[0]}/${parts[1]}...`;
}
