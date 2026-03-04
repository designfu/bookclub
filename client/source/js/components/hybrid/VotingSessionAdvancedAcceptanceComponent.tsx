import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { BookStatus, VotingSessionStatus } from 'types';
import { ReorderableList } from 'lib/reorderable-lists';
import { VotingSessionActions, VotingSessionActionTypes } from 'actions/VotingSessionActions';
import { ReduxActions } from 'actions/ReduxActions';
import { VoteCardRank } from 'components/display/VoteCardRank';
import { VoteCardDivider } from 'components/display/VoteCardDivider';
import { CloseAdvancedAcceptanceVotingDialogButton } from 'components/display/CloseAdvancedAcceptanceVotingDialogButton';
import { UserList } from 'components/display/UserList';
import { buildResetOrderSectionsFromPrevious, hasUsableVotesForUser } from 'utils/vote-reset';

const rankValueFor = (i, books: any[]) => {
  const divider = books.findIndex(book => book && book.isDivider === true);
  return i < divider
    ? i
    : -1;
};

function populateBooks(list = [], books = {}) {
  return list.map(_ => ({
    ..._,
    book: books[_.book] || _.book,
  }));
}
function populateUsers(list = [], users = {}) {
  return list.map(_ => ({
    ..._,
    user: users[_.user] || _.user,
  }));
}

function sortBooks(books = {}, votes = [], me = null) {
  if(Object.keys(books).length < 1) return [];
  const myVotes = votes.filter(_ => (_.user._id || _.user) === me._id).reduce((map, vote) => {
    return {
      ...map,
      [(vote.book._id || vote.book)]: vote.rank,
    }
  }, {});
  const bookList = Object.keys(books).map(id => books[id]);
  let chosenBooks = [];
  let otherBooks = [];
  bookList.forEach(book => {
    if(book.status !== BookStatus.SUGGESTED) return;
    if(myVotes[book._id] >= 0) {
      chosenBooks.push(book);
    } else {
      otherBooks.push(book);
    }
  });
  chosenBooks = chosenBooks.sort((a, b) => myVotes[a._id] - myVotes[b._id]);

  return chosenBooks.length > 0
    ? [...chosenBooks, {
      _id: 'divider',
      isDivider: true,
    }, ...otherBooks]
    : [...chosenBooks, ...otherBooks, {
      _id: 'divider',
      isDivider: true,
    }];
}

function extractBookList(props) {
  return sortBooks(props.books, props.votingSession.votes, props.users[props.myId]);
}

class VotingSessionAdvancedAcceptanceContainer_ extends React.Component<any, any> {
  closeVotingDialog: CloseAdvancedAcceptanceVotingDialogButton;

  constructor(props) {
    super(props);

    this.state = {
      books: extractBookList(props),
      enabled: true,
    };
  }

  render() {
    const { books, enabled } = this.state;
    const { votingSession, users, isAdmin, latestVotingSession } = this.props;
    const booksMap = this.props.books;
    const isOpen = this.props.votingSession.status === VotingSessionStatus.OPEN;
    const canReset = hasUsableVotesForUser(latestVotingSession, this.props.myId);
    if (votingSession.votes) {
      votingSession.votes = populateBooks(votingSession.votes, booksMap);
      votingSession.votes = populateUsers(votingSession.votes, users);
    }
    if (votingSession.results) {
      votingSession.results = populateBooks(votingSession.results, booksMap);
    }
    const hasVoted = votingSession.votes ? votingSession.votes.some(_ => _.user._id === this.props.myId) : false;

    let usersHaveVoted: any = votingSession.votes.reduce((users, vote: any) => ({
      ...users,
      [vote.user._id]: true,
    }), {});
    let usersHaveNotVoted: any = Object.values(users).reduce((users, user: any) => {
      if(!usersHaveVoted[user._id]) {
        users[user._id] = true;
      }
      return users;
    }, {});
    usersHaveVoted = Object.keys(usersHaveVoted).map(_id => users[_id]).filter(_ => !!_);
    usersHaveNotVoted = Object.keys(usersHaveNotVoted).map(_id => users[_id]).filter(_ => !!_);

    return (
      <div className='c-voting-session'>
        {isAdmin ?
          <div className='c-voting-session__users-status'>
            {usersHaveVoted.length > 0 ?
              <UserList
                label='Voted'
                voters={usersHaveVoted}
              />
            : null}
            {usersHaveNotVoted.length > 0 ?
              <UserList
                label='Not Voted'
                voters={usersHaveNotVoted}
              />
            : null}
          </div>
        : null}
        <div className='o-action-row c-voting-session__actions'>
          {isOpen ?
            <Button
              className='o-action'
              onClick={this.props.castVotes.bind(this)}
              disabled={!enabled}
            >
              {hasVoted ? 'Update Vote': 'Cast Vote'}
            </Button>
          : null}
          {isOpen ?
            <Tooltip title='Resets your list to your most recent voted-season order and places books new this season at the top.'>
              <Button
                className='o-action'
                onClick={this.resetFromLastSeason.bind(this)}
                disabled={!enabled || !canReset}
              >
                Reset
              </Button>
            </Tooltip>
          : null}
          {isAdmin ?
            <CloseAdvancedAcceptanceVotingDialogButton
              onRef={(ref) => this.closeVotingDialog = ref}
              onConfirm={this.props.closeVotingSession.bind(this)}
              books={this.props.books}
              votes={votingSession.votes}
              results={votingSession.results}
            />
          : null}
        </div>
        {isOpen ?
          <ReorderableList
            onUpdate={this.onListUpdate.bind(this)}
          >
            {books.filter(book => !!book).map((book, i) =>
              book.isDivider ?
                <VoteCardDivider key={book._id} />
              :
              <VoteCardRank
                key={book._id}
                i={i}
                rank={rankValueFor(i, books)}
                maxRank={books.length - 1}
                book={book}
                onVote={this.onVote.bind(this)}
              />
            )}
          </ReorderableList> : null}
      </div>
    );
  }

  onListUpdate(list) {
    const books = list.map(item => {
      if (item.key === 'divider') {
        return {
          _id: 'divider',
          isDivider: true,
        };
      } else {
        return this.props.books[item.key]
      }
    });
    this.setState({
      books,
      enabled: true,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({
        books: extractBookList(this.props),
      });
    }
  }

  onVote(book, rank) {
    let books = this.state.books.slice(0);
    books = books.filter(_ => _._id != book._id);
    books.splice(rank, 0, book);

    this.setState({
      books,
      enabled: true,
    });
  }

  resetFromLastSeason() {
    const { latestVotingSession, myId } = this.props;
    const currentBooks = this.state.books.filter((book) => !!book && !book.isDivider && book.status === BookStatus.SUGGESTED);
    if (!latestVotingSession || currentBooks.length < 1) {
      return;
    }

    const { topBooks, bottomBooks } = buildResetOrderSectionsFromPrevious({
      currentBooks,
      previousVotingSession: latestVotingSession,
      myId,
      voteOrderField: 'rank',
      descending: false,
      requireNonNegative: true,
    });

    this.setState({
      books: [...topBooks, { _id: 'divider', isDivider: true }, ...bottomBooks],
      enabled: true,
    });
  }
}

const mapStateToProps = (state: any) => {
  const latestId = state.votingSession.latestWithUserVotesId;
  const latestVotingSession = latestId ? state.votingSession.sessions[latestId] : null;
  return {
    isLoggedIn: state.users.isLoggedIn,
    isAdmin: state.users.isAdmin,
    myId: state.users.myId,
    users: state.users.users || {},
    books: state.books || {},
    votingSession: state.votingSession.currentId ? state.votingSession.sessions[state.votingSession.currentId] : {},
    latestVotingSession,
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    castVotes() {
      const votes = this.state.books
        .filter(book => !book.isDivider)
        .map((book, i) => ({
          user: this.props.myId,
          rank: rankValueFor(i, this.state.books),
          book: book._id,
        }))
        .filter(vote => vote.rank >= 0);
      dispatch(ReduxActions.onNext(VotingSessionActionTypes.GOT_VOTES_CAST, () => {
        this.setState({
          enabled: false,
        })
      }));
      dispatch(VotingSessionActions.castVotes(votes));
    },

    closeVotingSession(book) {
      dispatch(ReduxActions.onNext(VotingSessionActionTypes.GOT_CLOSE, () => {
        this.closeVotingDialog.closeDialog();
      }));
      dispatch(VotingSessionActions.closeVotingSession(book));
    },
  }
};

export const VotingSessionAdvancedAcceptanceContainer = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(VotingSessionAdvancedAcceptanceContainer_));
