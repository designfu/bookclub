import { BookStatus } from 'types';

type VoteOrderDraft = {
  userId: string;
  bookIds: string[];
  resetAddedBookIds: string[];
};

const draftCache: { [key: string]: VoteOrderDraft } = {};

function draftKey(votingSessionId, myId) {
  if (!votingSessionId || !myId) return null;
  return `vote-order-draft:${votingSessionId}:${myId}`;
}

function normalizeBookIds(books = []) {
  return books
    .map((book) => (book && book._id && book._id.toString ? book._id.toString() : book && book._id))
    .filter((id) => !!id);
}

function normalizeIds(ids = []) {
  return ids
    .map((id) => id && id.toString ? id.toString() : id)
    .filter((id) => !!id);
}

function emptyDraft(myId): VoteOrderDraft {
  return {
    userId: myId,
    bookIds: [],
    resetAddedBookIds: [],
  };
}

function loadDraftPayload(votingSessionId, myId): VoteOrderDraft {
  const key = draftKey(votingSessionId, myId);
  if (!key) return emptyDraft(myId);

  if (draftCache[key]) {
    return draftCache[key].userId === myId ? draftCache[key] : emptyDraft(myId);
  }

  try {
    const raw = window && window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    if (parsed && parsed.userId === myId && Array.isArray(parsed.bookIds)) {
      const payload = {
        userId: parsed.userId,
        bookIds: normalizeIds(parsed.bookIds),
        resetAddedBookIds: normalizeIds(parsed.resetAddedBookIds || []),
      };
      draftCache[key] = payload;
      return payload;
    }
  } catch (e) {
  }

  return emptyDraft(myId);
}

function loadDraft(votingSessionId, myId): string[] {
  return loadDraftPayload(votingSessionId, myId).bookIds;
}

export function saveVoteOrderDraft(votingSessionId, myId, books = [], resetAddedBookIds?) {
  const key = draftKey(votingSessionId, myId);
  if (!key) return;

  const ids = normalizeBookIds(books);
  const existing = loadDraftPayload(votingSessionId, myId);
  const payload = {
    userId: myId,
    bookIds: ids,
    resetAddedBookIds: typeof resetAddedBookIds === 'undefined'
      ? existing.resetAddedBookIds || []
      : normalizeIds(resetAddedBookIds),
  };
  draftCache[key] = payload;

  try {
    if (window && window.sessionStorage) {
      window.sessionStorage.setItem(key, JSON.stringify(payload));
    }
  } catch (e) {
  }
}

export function getVoteOrderDraftResetAddedBookIds(votingSessionId, myId) {
  return loadDraftPayload(votingSessionId, myId).resetAddedBookIds || [];
}

export function hydrateVoteOrderDraft(votingSessionId, myId, books = []) {
  const { books: draftBooks, addedFromLocalSessionMissIds } = applyVoteOrderDraftWithMeta(
    votingSessionId,
    myId,
    books,
  );
  const persisted = getVoteOrderDraftResetAddedBookIds(votingSessionId, myId);
  const resetAddedBookIds = Array.from(new Set([...(persisted || []), ...(addedFromLocalSessionMissIds || [])]));
  return {
    books: draftBooks,
    resetAddedBookIds,
  };
}

export function applyVoteOrderDraftWithMeta(votingSessionId, myId, books = []) {
  const ids = loadDraft(votingSessionId, myId);
  if (!ids.length || !books.length) {
    return {
      books,
      addedFromLocalSessionMissIds: [],
    };
  }

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

  const addedFromLocalSessionMissIds = normalizeBookIds(
    remaining.filter((book: any) => book && book.status === BookStatus.SUGGESTED)
  );

  return {
    books: [...ordered, ...remaining],
    addedFromLocalSessionMissIds,
  };
}

export function applyVoteOrderDraft(votingSessionId, myId, books = []) {
  return applyVoteOrderDraftWithMeta(votingSessionId, myId, books).books;
}
