import * as React from 'react';
import { Router, Route, Switch, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withRouter } from 'react-router';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { VotingSessionStatus } from 'types';
import { ReorderableList } from 'lib/reorderable-lists';
import { VotingSessionActions, VotingSessionActionTypes } from 'actions/VotingSessionActions';
import { ReduxActions } from 'actions/ReduxActions';
import { VoteCardRank } from 'components/display/VoteCardRank';
import { VoteCardDivider } from 'components/display/VoteCardDivider';
import { CloseAcceptanceVotingDialogButton } from 'components/display/CloseAcceptanceVotingDialogButton';
import { UserList } from 'components/display/UserList';
import { hasUsableVotesForUser } from 'utils/vote-reset';
import {
  buildAcceptanceResetBooks,
  extractAcceptanceBookList,
  mapReorderableListToAcceptanceBooks,
  moveAcceptanceBookToRank,
  rankValueForAcceptance,
} from 'utils/vote-reset-acceptance';
import {
  buildVotingParticipation,
  hasUserVoted,
  hydrateVotingSession,
  selectVotingSessionContainerState,
} from 'utils/voting-session-container';

class VotingSessionAcceptanceContainer_ extends React.Component<any, any> {
  closeVotingDialog: CloseAcceptanceVotingDialogButton;

  constructor(props) {
    super(props);

    this.state = {
      books: extractAcceptanceBookList(props),
      enabled: true,
    };
  }

  render() {
    const { books, enabled } = this.state;
    const { users, isAdmin, latestVotingSession } = this.props;
    const booksMap = this.props.books;
    const isOpen = this.props.votingSession.status === VotingSessionStatus.OPEN;
    const canReset = hasUsableVotesForUser(latestVotingSession, this.props.myId);
    const votingSession = hydrateVotingSession(this.props.votingSession, booksMap, users);
    const hasVoted = hasUserVoted(votingSession.votes, this.props.myId);
    const { usersHaveVoted, usersHaveNotVoted } = buildVotingParticipation(users, votingSession.votes);

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
            <CloseAcceptanceVotingDialogButton
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
                rank={rankValueForAcceptance(i, books)}
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
    const books = mapReorderableListToAcceptanceBooks(list, this.props.books);
    this.setState({
      books,
      enabled: true,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({
        books: extractAcceptanceBookList(this.props),
      });
    }
  }

  onVote(book, rank) {
    this.setState({
      books: moveAcceptanceBookToRank(this.state.books, book, rank),
      enabled: true,
    });
  }

  resetFromLastSeason() {
    this.setState({
      books: buildAcceptanceResetBooks({
        books: this.state.books,
        latestVotingSession: this.props.latestVotingSession,
        myId: this.props.myId,
      }),
      enabled: true,
    });
  }
}

const mapStateToProps = (state: any) => {
  return selectVotingSessionContainerState(state);
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    castVotes() {
      const votes = this.state.books
        .filter(book => !book.isDivider)
        .map((book, i) => ({
          user: this.props.myId,
          rank: rankValueForAcceptance(i, this.state.books),
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

export const VotingSessionAcceptanceContainer = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(VotingSessionAcceptanceContainer_));
