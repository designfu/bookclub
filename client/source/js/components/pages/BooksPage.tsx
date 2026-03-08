import * as React from 'react';
import Box from '@mui/material/Box';
import { connect } from 'react-redux';
import Grid from '@mui/material/Grid';
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
      <Grid
        container
        spacing={5}
        sx={{
          px: { xs: 2, md: 5 },
          py: 1.25,
        }}
      >
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Typography variant='h4'>All Books</Typography>
            <TextField
              variant='standard'
              placeholder='Search title or author'
              value={this.state.query}
              onChange={this.handleQueryChange}
              margin='dense'
              sx={{ width: { xs: '100%', md: 220 } }}
            />
          </Box>
          <EditableBookListContainer
            books={notMyBooks}
            separateStatuses={true}
            newSince={newSince}
            yourBookPlaceholders={filteredMyBookList}
            showAdminActions={true}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant='h4'>Your Books</Typography>
            {isLoggedIn ? <AddBookModalContainer /> : null }
          </Box>
          <EditableBookListContainer books={myBooks} collapseFinished={true} showAdminActions={false} />
        </Grid>
      </Grid>
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
