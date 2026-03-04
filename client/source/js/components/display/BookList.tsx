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

export class BookList extends React.Component<any, any> {
  renderBooks(books) {
    return books.map(({ book, id }) => (
      <BookCard
        isAdmin={this.props.isAdmin}
        myId={this.props.myId}
        key={id}
        book={book}
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
        return STATUS_VALS[b.book.status] - STATUS_VALS[a.book.status] || a.book.title.localeCompare(b.book.title);
      });

    if (this.props.separateStatuses) {
      const suggestedBooks = books.filter(({ book }) => book.status === BookStatus.SUGGESTED);
      const nonSuggestedBooks = books.filter(({ book }) => book.status !== BookStatus.SUGGESTED);
      const byStatus = nonSuggestedBooks.reduce((acc, item) => {
        const status = item.book && item.book.status ? item.book.status : 'UNKNOWN';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(item);
        return acc;
      }, {});
      const nonSuggestedStatuses = Object.keys(byStatus)
        .sort((a, b) => (STATUS_VALS[b] || -1) - (STATUS_VALS[a] || -1) || a.localeCompare(b));

      return (
        <div className='c-book-list'>
          <ul className='c-book-list__items'>
            {this.renderBooks(suggestedBooks)}
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
      const activeBooks = books.filter(({ book }) => book.status !== BookStatus.FINISHED);
      const finishedBooks = books.filter(({ book }) => book.status === BookStatus.FINISHED);

      return (
        <div className='c-book-list'>
          <ul className='c-book-list__items'>
            {this.renderBooks(activeBooks)}
          </ul>
          {finishedBooks.length > 0 ? (
            <details className='c-book-list__group'>
              <summary>Finished ({finishedBooks.length})</summary>
              <ul className='c-book-list__items'>
                {this.renderBooks(finishedBooks)}
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
