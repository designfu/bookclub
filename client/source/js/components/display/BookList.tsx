import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import { BookCard } from 'components/display/BookCard';
import { BookStatus } from 'types';

const Item = styled(Paper)({
  width: '100%',
  backgroundColor: 'transparent',
  boxShadow: 'none',
});

const bookListItemsSx = {
  m: 0,
  p: 0,
  listStyle: 'none',
};

const bookListGroupSx = {
  mt: 1.25,
  '& > summary': {
    cursor: 'pointer',
    ml: 2.5,
  },
  '& > .book-list-group-items': {
    pt: 1.25,
  },
};

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
      <Item key={id}>
        <BookCard
          isAdmin={this.props.isAdmin}
          myId={this.props.myId}
          showAdminActions={this.props.showAdminActions}
          book={book}
          isNew={this.isNewBook(book)}
          isYourBook={!!isPlaceholder}
          onEdit={this.props.onItemEdit}
          onDelete={this.props.onItemDelete}
          onPropose={this.props.onItemPropose}
          onRetract={this.props.onItemRetract}
        />
      </Item>
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
        .sort((a, b) => titleCompare(a, b));
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
        <Box>
          <Stack spacing={2} sx={bookListItemsSx}>
            {this.renderBooks(suggestedBooksWithPlaceholders)}
          </Stack>
          {nonSuggestedStatuses.map((status) => (
            <Box component='details' key={status} sx={bookListGroupSx}>
              <summary>{formatStatusLabel(status)} ({byStatus[status].length})</summary>
              <Stack spacing={2} sx={bookListItemsSx} className='book-list-group-items'>
                {this.renderBooks(byStatus[status])}
              </Stack>
            </Box>
          ))}
        </Box>
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
        <Box>
          <Stack spacing={2} sx={bookListItemsSx}>
            {this.renderBooks(alwaysVisibleBooks)}
          </Stack>
          {backlogBooks.length > 0 ? (
            <Box component='details' open sx={bookListGroupSx}>
              <summary>Backlog ({backlogBooks.length})</summary>
              <Stack spacing={2} sx={bookListItemsSx} className='book-list-group-items'>
                {this.renderBooks(backlogBooks)}
              </Stack>
            </Box>
          ) : null}
          {suggestedBooks.length > 0 ? (
            <Box component='details' sx={bookListGroupSx}>
              <summary>Suggested ({suggestedBooks.length})</summary>
              <Stack spacing={2} sx={bookListItemsSx} className='book-list-group-items'>
                {this.renderBooks(suggestedBooks)}
              </Stack>
            </Box>
          ) : null}
          {finishedBooks.length > 0 ? (
            <Box component='details' sx={bookListGroupSx}>
              <summary>Finished ({finishedBooks.length})</summary>
              <Stack spacing={2} sx={bookListItemsSx} className='book-list-group-items'>
                {this.renderBooks(sortedFinishedBooks)}
              </Stack>
            </Box>
          ) : null}
        </Box>
      );
    }

    return (
      <Stack spacing={2} sx={bookListItemsSx}>
        {this.renderBooks(books)}
      </Stack>
    );
  }
}
