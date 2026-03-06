import * as React from 'react';
import { Router, Route, Switch, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withRouter } from 'react-router';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { timeOf, toStandardString } from '@client/utils/dates';
import { SeasonActions } from 'actions/SeasonActions';
import { BookActions } from 'actions/BookActions';
import { SeasonInfoAcceptance } from 'components/display/SeasonInfoAcceptance';
import { SeasonInfoWeighted } from 'components/display/SeasonInfoWeighted';
import { VotingSessionActions } from '@client/actions/VotingSessionActions';
import { Book, Season, SeasonStatus } from '@shared/types';
import { SeasonInfoAdvancedAcceptance } from '@client/components/display/SeasonInfoAdvancedAcceptance';

function averageRatingOf(book): number {
  if (!book) {
    return -1;
  }
  if (typeof book.averageRating === 'number' && book.averageRating >= 0) {
    return book.averageRating;
  }
  const ratings = Array.isArray(book.ratings) ? book.ratings : [];
  if (!ratings.length) {
    return -1;
  }
  const total = ratings.reduce((sum, rating) => sum + (rating && typeof rating.value === 'number' ? rating.value : 0), 0);
  return total / ratings.length;
}

function userRatingOf(book, myId): number {
  if (!book || !myId) {
    return -1;
  }
  const ratings = Array.isArray(book.ratings) ? book.ratings : [];
  const myRating = ratings.find((rating) => {
    if (!rating || typeof rating.value !== 'number') {
      return false;
    }
    const ratingUser = rating.user && rating.user._id ? rating.user._id : rating.user;
    return ratingUser === myId;
  });
  return myRating ? myRating.value : -1;
}

function resolvedSeasonBook(season, books = {}) {
  if (!season || !season.book) {
    return null;
  }
  const seasonBookId = season.book._id || season.book;
  return books[seasonBookId] || season.book;
}

class SeasonsPage_ extends React.Component<any, any> {
  state = {
    sortMode: 'finishedDate',
  };

  render() {
    const {
      seasons,
      isLoggedIn,
      isAdmin,
      myId,
      width,
    } = this.props;
    const isSmallScreen = isWidthDown('sm', width);

    const seasonList = Object.keys(seasons)
      .map(id => seasons[id])
      .filter(season => season.status === SeasonStatus.COMPLETE)
      .filter((season) => {
        const book = resolvedSeasonBook(season, this.props.books);
        if (this.state.sortMode !== 'personalBookRating') {
          return true;
        }
        return userRatingOf(book, myId) >= 0;
      })
      .sort((a, b) => {
        const aBook = resolvedSeasonBook(a, this.props.books);
        const bBook = resolvedSeasonBook(b, this.props.books);
        if (this.state.sortMode === 'bookRating') {
          const aRating = averageRatingOf(aBook);
          const bRating = averageRatingOf(bBook);
          return bRating - aRating
            || timeOf(b.dates.finished) - timeOf(a.dates.finished);
        }
        if (this.state.sortMode === 'personalBookRating') {
          const aRating = userRatingOf(aBook, myId);
          const bRating = userRatingOf(bBook, myId);
          return bRating - aRating
            || timeOf(b.dates.finished) - timeOf(a.dates.finished);
        }
        return timeOf(b.dates.finished) - timeOf(a.dates.finished);
      });

    return (
      <div className='l-current-page'>
        <div className='c-seasons-page'>
          <FormControl className='o-field o-field--dropdown'>
            <InputLabel htmlFor='previous-seasons-sort'>Sort Previous Seasons</InputLabel>
            <Select
              value={this.state.sortMode}
              onChange={this.handleSortModeChange.bind(this)}
              inputProps={{
                name: 'sortMode',
                id: 'previous-seasons-sort',
              }}
            >
              <MenuItem value='finishedDate'>Finish Date (Most Recent)</MenuItem>
              <MenuItem value='bookRating'>Book Rating (Highest)</MenuItem>
              <MenuItem value='personalBookRating'>Your Book Rating (Highest)</MenuItem>
            </Select>
          </FormControl>
          {seasonList.map((season, i) => {
          const seasonBook = resolvedSeasonBook(season, this.props.books);

          const title = seasonBook && seasonBook.title
            ? seasonBook.title
            : season.dates.finished
              ? toStandardString(season.dates.finished)
              : 'Current Season';

          const votingSession = this.props.votingSessions[season.votingSession] || {};

          const books = votingSession.booksVotedOn && votingSession.booksVotedOn.length > 0
            ? votingSession.booksVotedOn.reduce((books, bookId) => {
              return {
                ...books,
                [bookId]: this.props.books[bookId],
              }
            }, {})
            : this.props.books;

          const SeasonInfo = {
            ['ACCEPTANCE_WITH_RANKED_TIEBREAKER']: SeasonInfoAcceptance,
            ['ADVANCED_ACCEPTANCE']: SeasonInfoAdvancedAcceptance,
            ['WEIGHTED_3X']: SeasonInfoWeighted,
          }[votingSession.system] || SeasonInfoWeighted;

          const rankNumber = this.state.sortMode === 'finishedDate'
            ? seasonList.length - i
            : i + 1;

          return (
              <div className={`c-seasons-page__row${isSmallScreen ? ' c-seasons-page__row--stacked' : ''}`} key={i}>
                <div className='c-seasons-page__rank'>#{rankNumber}</div>
                <div className='c-seasons-page__card'>
                  <SeasonInfo
                    books={books}
                    title={title}
                    season={{
                      ...season,
                      book: seasonBook,
                    }}
                    votingSession={votingSession}
                    onSeasonRename={isLoggedIn && isAdmin && season && season.status === SeasonStatus.COMPLETE && this.props.renameSeason.bind(this, season)}
                    onSeasonDelete={isLoggedIn && isAdmin && season && season.status === SeasonStatus.COMPLETE && this.props.deleteSeason.bind(this, season)}
                    onSeasonClose={this.props.closeSeason.bind(this, season)}
                    onRateBook={isLoggedIn && season && season.status === SeasonStatus.COMPLETE &&  this.props.rateBook.bind(this)}
                    allowClosing={isLoggedIn && isAdmin && season && season.status === SeasonStatus.STARTED}
                    startVotingOpen={false}
                    myId={myId}
                    hideBookPitch={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.componentDidMount();
  }

  handleSortModeChange(event) {
    this.setState({
      sortMode: event.target.value,
    });
  }
}

const mapStateToProps = (state: any) => {
  return {
    isLoggedIn: state.users.isLoggedIn,
    isAdmin: state.users.isAdmin,
    myId: state.users.myId,
    seasons: state.seasons.seasons,
    votingSessions: state.votingSession.sessions || {},
    currentSeason: state.seasons.seasons[state.seasons.currentId],
    votingSession: state.votingSession.currentId ? state.votingSession.sessions[state.votingSession.currentId]
      : state.votingSession.latestId ? state.votingSession.sessions[state.votingSession.latestId]
      : {},
    books: state.books || {},
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    componentDidMount() {
      dispatch(BookActions.fetchBookList());
      dispatch(VotingSessionActions.fetchAll());
      dispatch(SeasonActions.fetchSeasonList());
    },

    closeSeason(season: Season) {
      dispatch(SeasonActions.closeSeason(season));
    },

    renameSeason(season: Season, title: string) {
      dispatch(SeasonActions.updateSeason(season, {
        title
      }));
    },

    openNewSeason() {
      dispatch(SeasonActions.openSeason());
    },

    deleteSeason(season: Season) {
      dispatch(SeasonActions.deleteSeason(season));
    },

    rateBook({ book, value } : { book: Book, value: number }) {
      const user = this.props.myId;
      dispatch(BookActions.rateBook(book, {
        value,
        user,
      }));
    },
  }
};

export const SeasonsPage = withWidth()(withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(SeasonsPage_)));
