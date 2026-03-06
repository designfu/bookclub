import * as React from 'react';
import { connect } from 'react-redux';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
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
  state = {
    query: '',
  };

  render() {
    const { books, myId, isLoggedIn, previousSeason } = this.props;
    const layoutClassName = this.props.isSmallScreen ? 'l-books-page l-books-page--single-column' : 'l-books-page';
    const query = (this.state.query || '').trim().toLowerCase();
    const myBooks = {};
    const notMyBooks = {};
    const myBookList = [];
    const filteredMyBookList = [];
    const newSince = previousSeason && previousSeason.dates ? toTimestamp(previousSeason.dates.started) : 0;

    for(let id in books) {
      const book = books[id];
      const title = (book && book.title ? book.title : '').toLowerCase();
      const author = (book && book.author ? book.author : '').toLowerCase();
      const matches = !query || title.includes(query) || author.includes(query);
      if(book.suggestedBy === myId) {
        myBooks[id] = book;
        myBookList.push(book);
        if(matches) {
          filteredMyBookList.push(book);
        }
      } else {
        if(!matches) {
          continue;
        }
        notMyBooks[id] = book;
      }
    }

    return (
      <div className={layoutClassName}>
        <div className='l-books-page__column'>
          <div className='l-books-page__header'>
            <Typography variant='h4'>All Books</Typography>
            <TextField
              className='l-books-page__search'
              placeholder='Search title or author'
              value={this.state.query}
              onChange={this.handleQueryChange}
              margin='dense'
            />
          </div>
          <EditableBookListContainer
            books={notMyBooks}
            separateStatuses={true}
            newSince={newSince}
            yourBookPlaceholders={filteredMyBookList}
            showAdminActions={true}
          />
        </div>
        <div className='l-books-page__column'>
          <div className='o-action-title'>
            <Typography variant='h4'>Your Books</Typography>
            {isLoggedIn ? <AddBookModalContainer /> : null }
          </div>
          <EditableBookListContainer books={myBooks} collapseFinished={true} showAdminActions={false} />
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.componentDidMount();
  }

  handleQueryChange = (event) => {
    this.setState({
      query: event.target.value,
    });
  }
}

const BooksPageResponsive = (props) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <BooksPage_
      {...props}
      isSmallScreen={isSmallScreen}
    />
  );
};

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

export const BooksPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BooksPageResponsive);
