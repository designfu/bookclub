import { BookStatus } from 'types';
import { buildResetOrderSectionsFromPrevious } from 'utils/vote-reset';

export const ACCEPTANCE_DIVIDER_BOOK = {
  _id: 'divider',
  isDivider: true,
};

export const rankValueForAcceptance = (i, books: any[]) => {
  const divider = books.findIndex(book => book && book.isDivider === true);
  return i < divider
    ? i
    : -1;
};

export function sortAcceptanceBooks(books = {}, votes = [], me = null) {
  if(Object.keys(books).length < 1) return [];
  const myVotes = votes.filter(_ => (_.user._id || _.user) === me._id).reduce((map, vote) => {
    return {
      ...map,
      [(vote.book._id || vote.book)]: vote.rank,
    }
  }, {});
  const bookList = Object.keys(books).map(id => books[id]);
  let chosenBooks = [];
  let otherBooks = [];
  bookList.forEach(book => {
    if(book.status !== BookStatus.SUGGESTED) return;
    if(myVotes[book._id] >= 0) {
      chosenBooks.push(book);
    } else {
      otherBooks.push(book);
    }
  });
  chosenBooks = chosenBooks.sort((a, b) => myVotes[a._id] - myVotes[b._id]);

  return chosenBooks.length > 0
    ? [...chosenBooks, ACCEPTANCE_DIVIDER_BOOK, ...otherBooks]
    : [...chosenBooks, ...otherBooks, ACCEPTANCE_DIVIDER_BOOK];
}

export function extractAcceptanceBookList(props) {
  return sortAcceptanceBooks(props.books, props.votingSession.votes, props.users[props.myId]);
}

export function mapReorderableListToAcceptanceBooks(list, booksMap = {}) {
  return list.map(item => {
    if (item.key === ACCEPTANCE_DIVIDER_BOOK._id) {
      return ACCEPTANCE_DIVIDER_BOOK;
    }
    return booksMap[item.key];
  });
}

export function moveAcceptanceBookToRank(books = [], book, rank: number) {
  const next = books.slice(0).filter(_ => _._id != book._id);
  next.splice(rank, 0, book);
  return next;
}

export function buildAcceptanceResetBooks({
  books = [],
  latestVotingSession = null,
  myId = null,
}) {
  const currentBooks = books.filter((book) => !!book && !book.isDivider && book.status === BookStatus.SUGGESTED);
  if (!latestVotingSession || currentBooks.length < 1) {
    return books;
  }

  const { topBooks, bottomBooks } = buildResetOrderSectionsFromPrevious({
    currentBooks,
    previousVotingSession: latestVotingSession,
    myId,
    voteOrderField: 'rank',
    descending: false,
    requireNonNegative: true,
  });

  return [...topBooks, ACCEPTANCE_DIVIDER_BOOK, ...bottomBooks];
}
