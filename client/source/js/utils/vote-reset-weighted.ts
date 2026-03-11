import { BookStatus } from 'types';
import { buildResetOrderFromPrevious } from 'utils/vote-reset';

export function sortWeightedBooks(books = {}, votes = [], me = null) {
  if(Object.keys(books).length < 1) return [];
  const myVotes = votes.filter(_ => (_.user._id || _.user) === me._id).reduce((map, vote) => {
    return {
      ...map,
      [(vote.book._id || vote.book)]: vote.points,
    };
  }, {});
  const bookList = Object.keys(books).map(id => books[id]);
  let chosenBooks = [];
  let otherBooks = [];
  bookList.forEach(book => {
    if(book.status !== BookStatus.SUGGESTED) return;
    if(myVotes[book._id] > 0) {
      chosenBooks.push(book);
    } else {
      otherBooks.push(book);
    }
  });
  chosenBooks = chosenBooks.sort((a, b) => myVotes[b._id] - myVotes[a._id]);

  return [...chosenBooks, ...otherBooks];
}

export function extractWeightedBookList(props) {
  return sortWeightedBooks(props.books, props.votingSession.votes, props.users[props.myId]);
}

export function mapReorderableListToWeightedBooks(list, booksMap = {}) {
  return list.map(item => booksMap[item.key]);
}

export function moveWeightedBookToPoints(books = [], book, points: number, maxVotes: number) {
  const index = maxVotes - points;
  const next = books.slice(0).filter(_ => _._id != book._id);
  next.splice(index, 0, book);
  return next;
}

export function buildWeightedResetBooks({
  books = [],
  latestVotingSession = null,
  myId = null,
}) {
  const currentBooks = books.filter((book) => !!book && book.status === BookStatus.SUGGESTED);
  if (!latestVotingSession || currentBooks.length < 1) {
    return books;
  }
  return buildResetOrderFromPrevious({
    currentBooks,
    previousVotingSession: latestVotingSession,
    myId,
    voteOrderField: 'points',
    descending: true,
  });
}
