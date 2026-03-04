import axios from 'axios';

function normalizeGoodreadsUrl(url) {
  if(!url) {
    return '';
  }

  if(url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if(url.startsWith('www.')) {
    return `https://${url}`;
  }

  return `https://www.${url.replace(/^\/+/, '')}`;
}

function decodeHtmlEntities(value) {
  if(!value) {
    return value;
  }

  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseLdJsonBook(html) {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];

  for(const script of scripts) {
    const contentMatch = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if(!contentMatch || !contentMatch[1]) {
      continue;
    }

    try {
      const json = JSON.parse(contentMatch[1].trim());
      const candidates = Array.isArray(json) ? json : [json];

      for(const candidate of candidates) {
        if(!candidate || typeof candidate !== 'object') {
          continue;
        }

        const types = Array.isArray(candidate['@type']) ? candidate['@type'] : [candidate['@type']];
        const isBook = types.filter(Boolean).map(_ => _.toString().toLowerCase()).includes('book');
        if(!isBook) {
          continue;
        }

        let author = '';
        if(typeof candidate.author === 'string') {
          author = candidate.author;
        } else if(Array.isArray(candidate.author) && candidate.author.length > 0) {
          const firstAuthor = candidate.author[0];
          author = typeof firstAuthor === 'string' ? firstAuthor : firstAuthor.name;
        } else if(candidate.author && typeof candidate.author === 'object') {
          author = candidate.author.name;
        }

        return {
          title: candidate.name || '',
          author: author || '',
          image: candidate.image || '',
        };
      }
    } catch(err) {
      continue;
    }
  }

  return null;
}

function parseMetaContent(html, propertyName) {
  const exp = new RegExp(`<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const match = html.match(exp);
  return match && match[1] ? decodeHtmlEntities(match[1].trim()) : '';
}

function parseOpenGraph(html) {
  const ogTitle = parseMetaContent(html, 'og:title');
  const ogImage = parseMetaContent(html, 'og:image');
  let title = ogTitle;
  let author = '';

  // Goodreads og:title usually looks like "<Title> by <Author>".
  if(ogTitle && ogTitle.includes(' by ')) {
    const [rawTitle, ...authorParts] = ogTitle.split(' by ');
    title = rawTitle.trim();
    author = authorParts.join(' by ').trim();
  }

  return {
    title: title || '',
    author: author || '',
    image: ogImage || '',
  };
}

function pickBookDetails(html) {
  const ldJson = parseLdJsonBook(html);
  if(ldJson && (ldJson.title || ldJson.author || ldJson.image)) {
    return ldJson;
  }

  return parseOpenGraph(html);
}

async function discover(goodreadsUrl) {
  const normalizedUrl = normalizeGoodreadsUrl(goodreadsUrl);
  if(!normalizedUrl) {
    return {};
  }

  try {
    const response = await axios({
      method: 'GET',
      url: normalizedUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bookclub-bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: _ => _ >= 200 && _ < 400,
    });

    const html = typeof response.data === 'string' ? response.data : '';
    if(!html) {
      return {};
    }

    return pickBookDetails(html);
  } catch(err) {
    const response = err.response || {};
    console.log(`Error fetching Goodreads page: ${normalizedUrl}`, err.toString(), response.status);
    throw err;
  }
}

export default {
  discover,
};
