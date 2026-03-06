import { getRefId } from 'utils/vote-reset';

export function toBookId(book): string | null {
  const id = getRefId(book && book._id ? book._id : book);
  if (!id) {
    return null;
  }
  return id.toString ? id.toString() : id;
}

export function previousSessionBookIdSet(previousSession = null) {
  const votes = previousSession && Array.isArray((previousSession as any).votes) ? (previousSession as any).votes : [];
  const booksVotedOn = previousSession && Array.isArray((previousSession as any).booksVotedOn) ? (previousSession as any).booksVotedOn : [];
  const rawIds = booksVotedOn.length > 0
    ? booksVotedOn
    : votes.map((vote) => vote && vote.book);
  return rawIds.reduce((set, rawId) => {
    const id = toBookId(rawId);
    if (id) {
      set[id] = true;
    }
    return set;
  }, {});
}

export function computeResetAddedBookIds({
  localBooks = [],
  nextBooks = [],
  previousSession = null,
  shouldIgnoreBook = (_book) => false,
}) {
  const localBookIds = localBooks.reduce((set, book) => {
    if (shouldIgnoreBook(book)) {
      return set;
    }
    const id = toBookId(book);
    if (id) {
      set[id] = true;
    }
    return set;
  }, {});
  const previousBookIds = previousSessionBookIdSet(previousSession);
  return nextBooks
    .filter((book) => !!book && !shouldIgnoreBook(book))
    .map((book) => toBookId(book))
    .filter((id) => !!id && (!localBookIds[id] || !previousBookIds[id]));
}
