import * as React from 'react';
import { Router, Route, Switch, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withRouter } from 'react-router';
import Typography from '@material-ui/core/Typography';
import { EditableBookListContainer } from 'components/containers/EditableBookListContainer';
import { AddBookModalContainer } from 'components/containers/AddBookModalContainer';
import { AppstateActions } from 'actions/AppstateActions';
import { BookActions } from 'actions/BookActions';
import { SeasonActions } from 'actions/SeasonActions';

function toTimestamp(value): number {
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

class BooksPage_ extends React.Component<any, any> {
  render() {
    const { books, myId, isLoggedIn, previousSeason } = this.props;
    const myBooks = {};
    const notMyBooks = {};
    const newSince = previousSeason && previousSeason.dates ? toTimestamp(previousSeason.dates.finished) : 0;

    for(let id in books) {
      const book = books[id];
      if(book.suggestedBy === myId) {
        myBooks[id] = book;
      } else {
        notMyBooks[id] = book;
      }
    }

    return (
      <div className='l-books-page'>
        <div className='l-books-page__column'>
          <div className='o-action-title'>
            <Typography variant='h4'>Your Books</Typography>
            {isLoggedIn ? <AddBookModalContainer /> : null }
          </div>
          <EditableBookListContainer books={myBooks} collapseFinished={true} />
        </div>
        <div className='l-books-page__column'>
          <Typography variant='h4'>Other Books</Typography>
          <EditableBookListContainer books={notMyBooks} separateStatuses={true} newSince={newSince} />
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.componentDidMount();
  }
}

const mapStateToProps = (state: any) => {
  return {
    isLoggedIn: state.users.isLoggedIn,
    isAdmin: state.users.isAdmin,
    myId: state.users.myId,
    books: state.books || {},
    previousSeason: state.seasons.previousId ? state.seasons.seasons[state.seasons.previousId] : null,
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    componentDidMount() {
      dispatch(BookActions.fetchBookList());
      dispatch(SeasonActions.fetchCurrent());
    },
    openAddBookModal() {
      dispatch(AppstateActions.openAddBookModal());
    },
  }
};

export const BooksPage = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(BooksPage_));
