export function getRefId(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'object' && value._id) {
    return value._id;
  }
  return value;
}

function toTimestamp(season) {
  if (!season || !season.dates) {
    return 0;
  }
  const raw = season.dates.finished || season.dates.started || season.dates.created;
  if (!raw) {
    return 0;
  }
  if (typeof raw === 'number') {
    return raw;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toDateValue(raw) {
  if (!raw) {
    return null;
  }
  if (typeof raw === 'number') {
    return new Date(raw);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getSeasonSortTimestamp(season) {
  if (!season || !season.dates) {
    return 0;
  }
  const preferred = season.dates.finished || season.dates.started || season.dates.created;
  const dateValue = toDateValue(preferred);
  return dateValue ? dateValue.getTime() : 0;
}

function formatDateShort(raw) {
  const dateValue = toDateValue(raw);
  return dateValue ? dateValue.toLocaleDateString() : '--';
}

export function formatSeasonDateRange(season) {
  if (!season || !season.dates) {
    return '-- to --';
  }
  const start = season.dates.started || season.dates.created;
  const end = season.dates.finished;
  return `${formatDateShort(start)} to ${end ? formatDateShort(end) : 'Open'}`;
}

export function isAdminUser(user) {
  return !!(user && Array.isArray(user.roles) && user.roles.indexOf('ADMIN') > -1);
}

function getSeasonsBySessionId(seasonsById = {}) {
  return Object.keys(seasonsById || {}).reduce((map, seasonId) => {
    const season = seasonsById[seasonId];
    const votingSessionId = getRefId(season && season.votingSession);
    if (votingSessionId) {
      map[votingSessionId] = season;
    }
    return map;
  }, {});
}

export function withUserStats(user, booksById = {}, seasonsById = {}, votingSessionsById = {}) {
  const seasons = Object.keys(seasonsById || {}).map((id) => seasonsById[id]);
  const votedSeasons = seasons.filter((season) => {
    const votingSessionId = getRefId(season && season.votingSession);
    if (!votingSessionId || !votingSessionsById[votingSessionId]) {
      return false;
    }
    const session = votingSessionsById[votingSessionId];
    const votes = Array.isArray(session.votes) ? session.votes : [];
    return votes.some((vote) => getRefId(vote.user) === user._id);
  });

  votedSeasons.sort((a, b) => toTimestamp(b) - toTimestamp(a));
  const latestSeason = votedSeasons[0];
  const lastSeasonTitle = latestSeason ? (latestSeason._id || '--') : '--';
  const lastSeasonDateRange = latestSeason ? formatSeasonDateRange(latestSeason) : '--';

  const booksSuggestedCount = Object.keys(booksById || {})
    .map((id) => booksById[id])
    .filter((book) => getRefId(book.suggestedBy) === user._id)
    .length;
  const booksRatedCount = Object.keys(booksById || {})
    .map((id) => booksById[id])
    .filter((book) => {
      const ratings = Array.isArray(book && book.ratings) ? book.ratings : [];
      return ratings.some((rating) => getRefId(rating && rating.user) === user._id);
    })
    .length;

  return {
    user,
    booksSuggestedCount,
    booksRatedCount,
    seasonsVotedCount: votedSeasons.length,
    lastSeasonTimestamp: latestSeason ? toTimestamp(latestSeason) : 0,
    lastSeasonTitle,
    lastSeasonDateRange,
  };
}

export function getUsersWithStats(usersById = {}, booksById = {}, seasonsById = {}, votingSessionsById = {}) {
  return Object.keys(usersById || {})
    .map((id) => usersById[id])
    .filter((user) => !!user)
    .map((user) => withUserStats(user, booksById, seasonsById, votingSessionsById));
}

export function sortUsersByRoleAndRecentSeason(usersWithStats = []) {
  return usersWithStats.sort((a, b) => {
    const roleDiff = (isAdminUser(a.user) ? 0 : 1) - (isAdminUser(b.user) ? 0 : 1);
    if (roleDiff !== 0) {
      return roleDiff;
    }
    const seasonDiff = b.lastSeasonTimestamp - a.lastSeasonTimestamp;
    if (seasonDiff !== 0) {
      return seasonDiff;
    }
    return (a.user.name || '').localeCompare(b.user.name || '');
  });
}

export function getTransferTargetCandidates(usersById = {}, sourceUserId = '') {
  return Object.keys(usersById || {})
    .map((id) => usersById[id])
    .filter((user) => !!user && user._id !== sourceUserId)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export function buildTransferItemsWithData(
  sourceUserId,
  targetUserId,
  booksById = {},
  seasonsById = {},
  votingSessionsById = {},
) {
  const items = [];
  const ratingItems = [];
  const seasonVoteItems = [];
  const allBooks = Object.keys(booksById || {}).map((id) => booksById[id]);
  const sourceBooks = allBooks.filter((book) => getRefId(book.suggestedBy) === sourceUserId);

  sourceBooks.forEach((book) => {
    items.push({
      id: `book:${book._id}`,
      type: 'BOOK',
      checked: true,
      conflict: false,
      conflictReason: '',
      description: `${book.title || '--'} by ${book.author || '--'} (${book._id})`,
      bookId: book._id,
    });
  });

  allBooks.forEach((book) => {
    const ratings = Array.isArray(book && book.ratings) ? book.ratings : [];
    const sourceRating = ratings.find((rating) => getRefId(rating && rating.user) === sourceUserId);
    if (!sourceRating) {
      return;
    }
    const conflict = ratings.some((rating) => getRefId(rating && rating.user) === targetUserId);
    ratingItems.push({
      id: `book-rating:${book._id}`,
      type: 'BOOK_RATING',
      checked: !conflict,
      conflict,
      conflictReason: conflict ? 'Target user already has a rating for this book.' : '',
      description: `${book.title || '--'} (${book._id})`,
      bookId: book._id,
    });
  });

  const seasons = Object.keys(seasonsById || {}).map((id) => seasonsById[id]);
  const seasonsBySessionId = getSeasonsBySessionId(seasonsById);

  seasons.forEach((season) => {
    const sessionId = getRefId(season.votingSession);
    if (!sessionId) {
      return;
    }
    const session = votingSessionsById[sessionId];
    if (!session) {
      return;
    }
    const votes = Array.isArray(session.votes) ? session.votes : [];
    const sourceVotes = votes.filter((vote) => getRefId(vote.user) === sourceUserId);
    if (sourceVotes.length < 1) {
      return;
    }
    const conflict = votes.some((vote) => getRefId(vote.user) === targetUserId);
    const seasonInfo = seasonsBySessionId[sessionId];
    const seasonLabel = seasonInfo ? (seasonInfo.title || seasonInfo._id) : sessionId;
    seasonVoteItems.push({
      id: `season-votes:${season._id || sessionId}`,
      type: 'SEASON_VOTES',
      checked: !conflict,
      conflict,
      conflictReason: conflict ? 'Target user already has vote(s) in this season.' : '',
      description: `Season ${seasonLabel} (${formatSeasonDateRange(season)}) | ${sourceVotes.length} vote(s) from source user`,
      seasonId: season._id,
      sessionId,
      sortTimestamp: getSeasonSortTimestamp(season),
    });
  });

  seasonVoteItems.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
  return [
    ...items,
    ...ratingItems,
    ...seasonVoteItems.map((item) => {
      const { sortTimestamp, ...rest } = item;
      return rest;
    }),
  ];
}

export function buildDeletePreview(userId, booksById = {}, seasonsById = {}, votingSessionsById = {}) {
  const books = Object.keys(booksById || {})
    .map((id) => booksById[id])
    .filter((book) => getRefId(book.suggestedBy) === userId);
  const ratingItems = Object.keys(booksById || {})
    .map((id) => booksById[id])
    .map((book) => {
      const ratings = Array.isArray(book && book.ratings) ? book.ratings : [];
      const myRating = ratings.find((rating) => getRefId(rating && rating.user) === userId);
      if (!myRating) {
        return null;
      }
      return {
        bookId: book._id,
        title: book.title || '--',
        value: myRating.value,
      };
    })
    .filter((item) => !!item)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const seasonsBySessionId = getSeasonsBySessionId(seasonsById);
  const voteItems = Object.keys(votingSessionsById || {})
    .map((sessionId) => {
      const session = votingSessionsById[sessionId];
      const votes = Array.isArray(session && session.votes) ? session.votes : [];
      const count = votes.filter((vote) => getRefId(vote.user) === userId).length;
      if (count < 1) {
        return null;
      }
      const season = seasonsBySessionId[sessionId];
      return {
        sessionId,
        count,
        seasonLabel: season ? (season.title || season._id) : sessionId,
      };
    })
    .filter((item) => !!item)
    .sort((a, b) => (a.seasonLabel || '').localeCompare(b.seasonLabel || ''));

  return {
    books,
    ratingItems,
    voteItems,
  };
}
