import { VotingSessionStatus } from 'types';

export function getRefId(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'object' && value._id) {
    return value._id;
  }
  return value;
}

export function dateToNumber(raw) {
  if (!raw) {
    return 0;
  }
  if (typeof raw === 'number') {
    return raw;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getPreviousVotingSession(votingSessions = {}, currentId = null) {
  return getMostRecentVotingSessionWithVotes(votingSessions, currentId);
}

export function getMostRecentVotingSessionWithVotes(votingSessions = {}, currentId = null, myId = null) {
  const orderedSessions = Object.keys(votingSessions)
    .map((id) => votingSessions[id])
    .filter((session) => !!session && session._id !== currentId && !!(session.status === VotingSessionStatus.COMPLETE || (session.dates && session.dates.finished)))
    .sort((a, b) => dateToNumber(b && b.dates && b.dates.finished) - dateToNumber(a && a.dates && a.dates.finished));

  const sessionsWithVotes = orderedSessions.filter((session) => Array.isArray(session.votes) && session.votes.length > 0);
  if (myId) {
    const withMyVotes = sessionsWithVotes.find((session) =>
      session.votes.some((vote) => getRefId(vote.user) === myId)
    );
    if (withMyVotes) {
      return withMyVotes;
    }
  }
  return sessionsWithVotes[0];
}

export function buildResetOrderFromPrevious({
  currentBooks = [],
  previousVotingSession = null,
  myId = null,
  voteOrderField = 'rank',
  descending = false,
  requireNonNegative = false,
}) {
  if (!previousVotingSession || !myId || currentBooks.length < 1) {
    return currentBooks;
  }

  const previousVotes = Array.isArray(previousVotingSession.votes) ? previousVotingSession.votes : [];
  const previousBooksVotedOn = Array.isArray(previousVotingSession.booksVotedOn) ? previousVotingSession.booksVotedOn : [];
  const previousBookSet = new Set<string>(
    (previousBooksVotedOn.length > 0
      ? previousBooksVotedOn.map((book) => getRefId(book))
      : previousVotes.map((vote) => getRefId(vote.book)))
      .filter((id) => !!id)
  );

  const rawUserVotes = previousVotes.filter((vote) => getRefId(vote.user) === myId);
  const hasPreferred = rawUserVotes.some((vote) =>
    typeof vote[voteOrderField] === 'number' && (!requireNonNegative || vote[voteOrderField] >= 0)
  );
  const hasRank = rawUserVotes.some((vote) => typeof vote.rank === 'number' && vote.rank >= 0);
  const hasPoints = rawUserVotes.some((vote) => typeof vote.points === 'number');
  const effectiveField = hasPreferred ? voteOrderField : (hasRank ? 'rank' : (hasPoints ? 'points' : voteOrderField));
  const effectiveDescending = effectiveField === 'points' ? true : (effectiveField === 'rank' ? false : descending);
  const effectiveRequireNonNegative = effectiveField === 'rank' ? true : requireNonNegative;

  const userPreviousVotes = rawUserVotes
    .filter((vote) => {
      if (typeof vote[effectiveField] !== 'number') {
        return false;
      }
      if (effectiveRequireNonNegative) {
        return vote[effectiveField] >= 0;
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[effectiveField];
      const bv = b[effectiveField];
      return effectiveDescending ? (bv - av) : (av - bv);
    });

  const orderedPreviousBookIds = userPreviousVotes.map((vote) => getRefId(vote.book)).filter((id) => !!id);
  const currentById = currentBooks.reduce((map, book) => {
    map[book._id] = book;
    return map;
  }, {});

  const newBooks = currentBooks.filter((book) => !previousBookSet.has(book._id));
  const orderedReturningBooks = orderedPreviousBookIds
    .map((bookId) => currentById[bookId])
    .filter((book) => !!book && !newBooks.find((newBook) => newBook._id === book._id));
  const orderedIds = new Set([...newBooks, ...orderedReturningBooks].map((book) => book._id));
  const remainingBooks = currentBooks.filter((book) => !orderedIds.has(book._id));

  return [...newBooks, ...orderedReturningBooks, ...remainingBooks];
}

export function buildResetOrderSectionsFromPrevious({
  currentBooks = [],
  previousVotingSession = null,
  myId = null,
  voteOrderField = 'rank',
  descending = false,
  requireNonNegative = false,
}) {
  if (!previousVotingSession || !myId || currentBooks.length < 1) {
    return {
      topBooks: currentBooks,
      bottomBooks: [],
    };
  }

  const previousVotes = Array.isArray(previousVotingSession.votes) ? previousVotingSession.votes : [];
  const previousBooksVotedOn = Array.isArray(previousVotingSession.booksVotedOn) ? previousVotingSession.booksVotedOn : [];
  const previousBookSet = new Set<string>(
    (previousBooksVotedOn.length > 0
      ? previousBooksVotedOn.map((book) => getRefId(book))
      : previousVotes.map((vote) => getRefId(vote.book)))
      .filter((id) => !!id)
  );

  const rawUserVotes = previousVotes.filter((vote) => getRefId(vote.user) === myId);
  const hasPreferred = rawUserVotes.some((vote) =>
    typeof vote[voteOrderField] === 'number' && (!requireNonNegative || vote[voteOrderField] >= 0)
  );
  const hasRank = rawUserVotes.some((vote) => typeof vote.rank === 'number' && vote.rank >= 0);
  const hasPoints = rawUserVotes.some((vote) => typeof vote.points === 'number');
  const effectiveField = hasPreferred ? voteOrderField : (hasRank ? 'rank' : (hasPoints ? 'points' : voteOrderField));
  const effectiveDescending = effectiveField === 'points' ? true : (effectiveField === 'rank' ? false : descending);
  const effectiveRequireNonNegative = effectiveField === 'rank' ? true : requireNonNegative;

  const userPreviousVotes = rawUserVotes
    .filter((vote) => {
      if (typeof vote[effectiveField] !== 'number') {
        return false;
      }
      if (effectiveRequireNonNegative) {
        return vote[effectiveField] >= 0;
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[effectiveField];
      const bv = b[effectiveField];
      return effectiveDescending ? (bv - av) : (av - bv);
    });

  const orderedPreviousBookIds = userPreviousVotes.map((vote) => getRefId(vote.book)).filter((id) => !!id);
  const currentById = currentBooks.reduce((map, book) => {
    map[book._id] = book;
    return map;
  }, {});

  const newBooks = currentBooks.filter((book) => !previousBookSet.has(book._id));
  const orderedReturningBooks = orderedPreviousBookIds
    .map((bookId) => currentById[bookId])
    .filter((book) => !!book && !newBooks.find((newBook) => newBook._id === book._id));
  const topIds = new Set([...newBooks, ...orderedReturningBooks].map((book) => book._id));
  const bottomBooks = currentBooks.filter((book) => !topIds.has(book._id));

  return {
    topBooks: [...newBooks, ...orderedReturningBooks],
    bottomBooks,
  };
}

export function hasUsableVotesForUser(votingSession = null, myId = null) {
  if (!votingSession || !myId) {
    return false;
  }
  const votes = Array.isArray(votingSession.votes) ? votingSession.votes : [];
  return votes.some((vote) =>
    getRefId(vote.user) === myId
      && ((typeof vote.rank === 'number' && vote.rank >= 0) || typeof vote.points === 'number')
  );
}
