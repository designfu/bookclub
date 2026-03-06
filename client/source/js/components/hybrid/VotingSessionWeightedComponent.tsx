import * as React from 'react';
import { connect } from 'react-redux';
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
import {
  hydrateVoteOrderDraft,
  hasVoteOrderDraft,
  saveVoteOrderDraft,
} from 'utils/vote-order-draft';
import { computeResetAddedBookIds, orderBooksByResetAdded, toBookId } from 'utils/vote-reset-highlight';

const pointsFor = (i) => Math.max(Config.MAX_VOTES - i, 0);

class VotingSessionWeightedContainer_ extends React.Component<any, any> {
  closeVotingDialog: CloseWeightedVotingDialogButton;

  constructor(props) {
    super(props);

    const { books, resetAddedBookIds } = this.booksAndResetIdsFromProps(props);
    this.state = {
      books,
      enabled: true,
      resetAddedBookIds,
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
            <Tooltip title='Resets your list to your most recent voted-season order.'>
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
                isResetAdded={this.state.resetAddedBookIds.indexOf(toBookId(book)) > -1}
                onVote={this.onVote.bind(this)}
              />
            )}
          </ReorderableList> : null}
      </div>
    );
  }

  onListUpdate(list) {
    const books = mapReorderableListToWeightedBooks(list, this.props.books);
    this.persistVoteOrderDraft(books);
    this.setState({
      books,
      enabled: true,
    });
  }

  async componentDidMount() {
    const votingSession = hydrateVotingSession(this.props.votingSession, this.props.books, this.props.users);
    const hasCurrentVote = hasUserVoted(votingSession.votes, this.props.myId);
    const hasDraft = hasVoteOrderDraft(this.props.votingSession && this.props.votingSession._id, this.props.myId);
    if (!hasCurrentVote && !hasDraft) {
      await this.resetFromLastSeason();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      const { books, resetAddedBookIds } = this.booksAndResetIdsFromProps(this.props);
      this.setState({
        books,
        resetAddedBookIds,
      });
    }
  }

  componentWillUnmount() {
    this.persistVoteOrderDraft(this.state.books);
  }

  onVote(book, points) {
    const books = moveWeightedBookToPoints(this.state.books, book, points, Config.MAX_VOTES);
    this.persistVoteOrderDraft(books);
    this.setState({
      books,
      enabled: true,
    });
  }

  async resetFromLastSeason() {
    const latestVotingSession = await this.props.fetchLatestWithUserVotes();
    const previousSession = latestVotingSession || this.props.latestVotingSession;
    const resetBooks = buildWeightedResetBooks({
      books: this.state.books,
      latestVotingSession: previousSession,
      myId: this.props.myId,
    });
    const resetAddedBookIds = this.resetAddedIdsForBooks(resetBooks, previousSession);
    const books = orderBooksByResetAdded(resetBooks, resetAddedBookIds);
    this.persistVoteOrderDraft(books, resetAddedBookIds);
    this.setState({
      books,
      enabled: true,
      resetAddedBookIds,
    });
  }

  booksAndResetIdsFromProps(props) {
    return hydrateVoteOrderDraft(
      props.votingSession && props.votingSession._id,
      props.myId,
      extractWeightedBookList(props),
    );
  }

  persistVoteOrderDraft(books, resetAddedBookIds = this.state.resetAddedBookIds) {
    saveVoteOrderDraft(
      this.props.votingSession && this.props.votingSession._id,
      this.props.myId,
      books,
      resetAddedBookIds,
    );
  }

  resetAddedIdsForBooks(books = [], previousSession = null) {
    return computeResetAddedBookIds({
      localBooks: this.state.books,
      nextBooks: books,
      previousSession,
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
          resetAddedBookIds: [],
        });
        this.persistVoteOrderDraft(this.state.books, []);
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

export const VotingSessionWeightedContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(VotingSessionWeightedContainer_);
