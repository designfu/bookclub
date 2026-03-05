import * as React from 'react';
import { Router, Route, Switch, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withRouter } from 'react-router';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Config from 'config';
import { VotingSessionStatus } from 'types';
import { ReorderableList } from 'lib/reorderable-lists';
import { VotingSessionActions, VotingSessionActionTypes } from 'actions/VotingSessionActions';
import { ReduxActions } from 'actions/ReduxActions';
import { VoteCard } from 'components/display/VoteCard';
import { CloseWeightedVotingDialogButton } from 'components/display/CloseWeightedVotingDialogButton';
import { UserList } from 'components/display/UserList';
import {
  buildWeightedResetBooks,
  extractWeightedBookList,
  mapReorderableListToWeightedBooks,
  moveWeightedBookToPoints,
} from 'utils/vote-reset-weighted';
import {
  buildVotingParticipation,
  hasUserVoted,
  hydrateVotingSession,
  selectVotingSessionContainerState,
} from 'utils/voting-session-container';

const pointsFor = (i) => Math.max(Config.MAX_VOTES - i, 0);

class VotingSessionWeightedContainer_ extends React.Component<any, any> {
  closeVotingDialog: CloseWeightedVotingDialogButton;

  constructor(props) {
    super(props);

    this.state = {
      books: extractWeightedBookList(props),
      enabled: true,
    };
  }

  render() {
    const { books, enabled } = this.state;
    const { users, isAdmin, latestVotingSession } = this.props;
    const booksMap = this.props.books;
    const isOpen = this.props.votingSession.status === VotingSessionStatus.OPEN;
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
              >
                Reset
              </Button>
            </Tooltip>
          : null}
          {isAdmin ?
            <CloseWeightedVotingDialogButton
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
            {books.map((book, i) =>
              <VoteCard
                key={book._id}
                i={i}
                points={pointsFor(i)}
                book={book}
                onVote={this.onVote.bind(this)}
              />
            )}
          </ReorderableList> : null}
      </div>
    );
  }

  onListUpdate(list) {
    this.setState({
      books: mapReorderableListToWeightedBooks(list, this.props.books),
      enabled: true,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({
        books: extractWeightedBookList(this.props),
      });
    }
  }

  onVote(book, points) {
    this.setState({
      books: moveWeightedBookToPoints(this.state.books, book, points, Config.MAX_VOTES),
      enabled: true,
    });
  }

  async resetFromLastSeason() {
    const latestVotingSession = await this.props.fetchLatestWithUserVotes();
    this.setState({
      books: buildWeightedResetBooks({
        books: this.state.books,
        latestVotingSession: latestVotingSession || this.props.latestVotingSession,
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
      const votes = this.state.books.slice(0, Config.MAX_VOTES).map((book, i) => ({
        user: this.props.myId,
        points: pointsFor(i),
        book: book._id,
      }));
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

    fetchLatestWithUserVotes() {
      return dispatch(VotingSessionActions.fetchLatestWithUserVotes());
    },
  }
};

export const VotingSessionWeightedContainer = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(VotingSessionWeightedContainer_));
