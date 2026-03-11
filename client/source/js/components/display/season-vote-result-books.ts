function toId(value) {
  return value && value.toString ? value.toString() : value;
}

export function resolveVoteResultBook(books = {}, rawBookId) {
  const bookId = toId(rawBookId);
  const book = bookId ? books[bookId] : null;
  if (book) {
    return book;
  }
  return {
    _id: bookId || `deleted-${Math.random()}`,
    title: 'Deleted book',
    author: '',
    links: {
      image: '',
    },
    isDeletedPlaceholder: true,
  };
}

export function excludeChosenWinner(list = [], seasonBook = {}, topResultBookId = null) {
  const chosenBookId = toId((seasonBook as any) && ((seasonBook as any)._id || seasonBook));
  return chosenBookId && chosenBookId === topResultBookId
    ? list.filter((book) => toId(book && book._id) !== chosenBookId)
    : list;
}
