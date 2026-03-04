import * as React from 'react';
import { BookCard } from 'components/display/BookCard';

const STATUS_VALS = {
  READING: 3,
  SUGGESTED: 2,
  BACKLOG: 1,
  FINISHED: 0,
};

export class BookList extends React.Component<any, any> {
  render() {
    const books = Object.keys(this.props.books || {})
      .map((id) => ({ id, book: this.props.books[id] }))
      .sort((a, b) => {
        return STATUS_VALS[b.book.status] - STATUS_VALS[a.book.status] || a.book.title.localeCompare(b.book.title);
      });

    return (
      <ul>
        {books.map(({ book, id }, index) => {
          const prev = books[index - 1];
          const statusBreak = !!this.props.separateStatuses && !!prev && prev.book.status !== book.status;
          return (
          <BookCard
            isAdmin={this.props.isAdmin}
            myId={this.props.myId}
            key={id}
            book={book}
            statusBreak={statusBreak}
            onEdit={this.props.onItemEdit}
            onDelete={this.props.onItemDelete}
            onPropose={this.props.onItemPropose}
            onRetract={this.props.onItemRetract}
          />
        )})}
      </ul>
    );
  }
}
