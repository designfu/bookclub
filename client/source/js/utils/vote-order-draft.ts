import { BookStatus } from 'types';

const draftCache: { [key: string]: { userId: string; bookIds: string[] } } = {};

function draftKey(votingSessionId, myId) {
  if (!votingSessionId || !myId) return null;
  return `vote-order-draft:${votingSessionId}:${myId}`;
}

function normalizeBookIds(books = []) {
  return books
    .map((book) => (book && book._id && book._id.toString ? book._id.toString() : book && book._id))
    .filter((id) => !!id);
}

function loadDraft(votingSessionId, myId): string[] {
  const key = draftKey(votingSessionId, myId);
  if (!key) return [];

  if (draftCache[key]) {
    return draftCache[key].userId === myId ? draftCache[key].bookIds : [];
  }

  try {
    const raw = window && window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    if (parsed && parsed.userId === myId && Array.isArray(parsed.bookIds)) {
      draftCache[key] = parsed;
      return parsed.bookIds;
    }
  } catch (e) {
  }

  return [];
}

export function saveVoteOrderDraft(votingSessionId, myId, books = []) {
  const key = draftKey(votingSessionId, myId);
  if (!key) return;

  const ids = normalizeBookIds(books);
  const payload = {
    userId: myId,
    bookIds: ids,
  };
  draftCache[key] = payload;

  try {
    if (window && window.sessionStorage) {
      window.sessionStorage.setItem(key, JSON.stringify(payload));
    }
  } catch (e) {
  }
}

export function applyVoteOrderDraft(votingSessionId, myId, books = []) {
  const ids = loadDraft(votingSessionId, myId);
  if (!ids.length || !books.length) return books;

  const seen = {};
  const booksById = books.reduce((map, book) => {
    if (!book || !book._id) return map;
    const id = book._id.toString ? book._id.toString() : book._id;
    return {
      ...map,
      [id]: book,
    };
  }, {});

  const ordered = ids.reduce((list, id) => {
    if (booksById[id] && !seen[id]) {
      seen[id] = true;
      list.push(booksById[id]);
    }
    return list;
  }, []);

  const remaining = books.filter((book) => {
    if (!book || !book._id) return false;
    const id = book._id.toString ? book._id.toString() : book._id;
    return !seen[id];
  });

  const newSuggested = remaining.filter((book: any) => book && book.status === BookStatus.SUGGESTED);
  const otherRemaining = remaining.filter((book: any) => !book || book.status !== BookStatus.SUGGESTED);

  return [...newSuggested, ...ordered, ...otherRemaining];
}
