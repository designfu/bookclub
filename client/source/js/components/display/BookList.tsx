import * as React from 'react';
import { BookCard } from 'components/display/BookCard';
import { BookStatus } from 'types';

const STATUS_VALS = {
  READING: 3,
  SUGGESTED: 2,
  BACKLOG: 1,
  FINISHED: 0,
};

function formatStatusLabel(status) {
  if (!status) {
    return 'Unknown';
  }
  const lower = status.toString().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCompare(a, b): number {
  const aTitle = a && a.book && a.book.title ? a.book.title : '';
  const bTitle = b && b.book && b.book.title ? b.book.title : '';
  return aTitle.localeCompare(bTitle);
}

function createdTimestamp(book): number {
  const raw = book && book.dates ? book.dates.created : null;
  if (typeof raw === 'number') {
    return raw;
  }
  if (raw instanceof Date) {
    return raw.getTime();
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function proposedTimestamp(book): number {
  const raw = book && book.dates ? book.dates.proposed : null;
  if (typeof raw === 'number') {
    return raw;
  }
  if (raw instanceof Date) {
    return raw.getTime();
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function finishedTimestamp(book): number {
  const raw = book && book.dates ? book.dates.finished : null;
  if (typeof raw === 'number') {
    return raw;
  }
  if (raw instanceof Date) {
    return raw.getTime();
  }
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function sortBooksByDateForStatus(a, b, status?: string) {
  if (status === BookStatus.FINISHED) {
    return finishedTimestamp(b.book) - finishedTimestamp(a.book)
      || a.book.title.localeCompare(b.book.title);
  }
  return createdTimestamp(b.book) - createdTimestamp(a.book)
    || a.book.title.localeCompare(b.book.title);
}

export class BookList extends React.Component<any, any> {
  isNewBook(book): boolean {
    const cutoff = this.props.newSince || 0;
    if (!cutoff) {
      return false;
    }
    return proposedTimestamp(book) > cutoff;
  }

  renderBooks(books) {
    return books.map(({ book, id, isPlaceholder }) => (
      <BookCard
        isAdmin={this.props.isAdmin}
        myId={this.props.myId}
        key={id}
        book={book}
        isNew={this.isNewBook(book)}
        isYourBook={!!isPlaceholder}
        onEdit={this.props.onItemEdit}
        onDelete={this.props.onItemDelete}
        onPropose={this.props.onItemPropose}
        onRetract={this.props.onItemRetract}
      />
    ));
  }

  render() {
    const books = Object.keys(this.props.books || {})
      .map((id) => ({ id, book: this.props.books[id] }))
      .sort((a, b) => {
        return STATUS_VALS[b.book.status] - STATUS_VALS[a.book.status]
          || sortBooksByDateForStatus(a, b, a.book.status)
          || a.book.title.localeCompare(b.book.title);
      });

    if (this.props.separateStatuses) {
      const yourBookPlaceholders = (this.props.yourBookPlaceholders || []).map((book, i) => ({
        id: `placeholder-${book._id || i}`,
        book,
        isPlaceholder: true,
      }));
      const suggestedBooks = books.filter(({ book }) => book.status === BookStatus.SUGGESTED);
      const yourSuggestedPlaceholders = yourBookPlaceholders.filter(({ book }) => book.status === BookStatus.SUGGESTED);
      const suggestedBooksWithPlaceholders = [...suggestedBooks, ...yourSuggestedPlaceholders]
        .sort((a, b) => {
          const aIsNew = this.isNewBook(a.book);
          const bIsNew = this.isNewBook(b.book);
          return Number(bIsNew) - Number(aIsNew)
            || titleCompare(a, b);
        });
      const nonSuggestedBooks = [
        ...books.filter(({ book }) => book.status !== BookStatus.SUGGESTED),
        ...yourBookPlaceholders.filter(({ book }) => book.status !== BookStatus.SUGGESTED),
      ];
      const byStatus = nonSuggestedBooks.reduce((acc, item) => {
        const status = item.book && item.book.status ? item.book.status : 'UNKNOWN';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(item);
        return acc;
      }, {});
      Object.keys(byStatus).forEach((status) => {
        byStatus[status] = byStatus[status]
          .sort((a, b) => sortBooksByDateForStatus(a, b, status));
      });
      const nonSuggestedStatuses = Object.keys(byStatus)
        .sort((a, b) => (STATUS_VALS[b] || -1) - (STATUS_VALS[a] || -1) || a.localeCompare(b));

      return (
        <div className='c-book-list'>
          <ul className='c-book-list__items'>
            {this.renderBooks(suggestedBooksWithPlaceholders)}
          </ul>
          {nonSuggestedStatuses.map((status) => (
            <details key={status} className='c-book-list__group'>
              <summary>{formatStatusLabel(status)} ({byStatus[status].length})</summary>
              <ul className='c-book-list__items'>
                {this.renderBooks(byStatus[status])}
              </ul>
            </details>
          ))}
        </div>
      );
    }

    if (this.props.collapseFinished) {
      const alwaysVisibleBooks = books.filter(({ book }) =>
        book.status !== BookStatus.FINISHED
        && book.status !== BookStatus.SUGGESTED
        && book.status !== BookStatus.BACKLOG
      );
      const backlogBooks = books.filter(({ book }) => book.status === BookStatus.BACKLOG);
      const suggestedBooks = books.filter(({ book }) => book.status === BookStatus.SUGGESTED);
      const finishedBooks = books.filter(({ book }) => book.status === BookStatus.FINISHED);
      const sortedFinishedBooks = finishedBooks
        .sort((a, b) => sortBooksByDateForStatus(a, b, BookStatus.FINISHED));

      return (
        <div className='c-book-list'>
          <ul className='c-book-list__items'>
            {this.renderBooks(alwaysVisibleBooks)}
          </ul>
          {backlogBooks.length > 0 ? (
            <details className='c-book-list__group' open>
              <summary>Backlog ({backlogBooks.length})</summary>
              <ul className='c-book-list__items'>
                {this.renderBooks(backlogBooks)}
              </ul>
            </details>
          ) : null}
          {suggestedBooks.length > 0 ? (
            <details className='c-book-list__group'>
              <summary>Suggested ({suggestedBooks.length})</summary>
              <ul className='c-book-list__items'>
                {this.renderBooks(suggestedBooks)}
              </ul>
            </details>
          ) : null}
          {finishedBooks.length > 0 ? (
            <details className='c-book-list__group'>
              <summary>Finished ({finishedBooks.length})</summary>
              <ul className='c-book-list__items'>
                {this.renderBooks(sortedFinishedBooks)}
              </ul>
            </details>
          ) : null}
        </div>
      );
    }

    return (
      <ul>
        {this.renderBooks(books)}
      </ul>
    );
  }
}
