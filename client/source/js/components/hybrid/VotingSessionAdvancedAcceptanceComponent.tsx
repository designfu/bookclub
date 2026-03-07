import * as React from 'react';
import { connect } from 'react-redux';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { VotingSessionStatus } from 'types';
import { ReorderableVotingList } from 'lib/reorderable-lists';
import { VotingSessionActions, VotingSessionActionTypes } from 'actions/VotingSessionActions';
import { ReduxActions } from 'actions/ReduxActions';
import { VoteCardRank } from 'components/display/VoteCardRank';
import { VoteCardDivider } from 'components/display/VoteCardDivider';
import { CloseAdvancedAcceptanceVotingDialogButton } from 'components/display/CloseAdvancedAcceptanceVotingDialogButton';
import { UserList } from 'components/display/UserList';
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
import {
  hydrateVoteOrderDraft,
  hasVoteOrderDraft,
  saveVoteOrderDraft,
} from 'utils/vote-order-draft';
import { computeResetAddedBookIds, orderBooksByResetAdded, toBookId } from 'utils/vote-reset-highlight';

class VotingSessionAdvancedAcceptanceContainer_ extends React.Component<any, any> {
  closeVotingDialog: CloseAdvancedAcceptanceVotingDialogButton;

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
            <Tooltip title='Reset to votes for this season, or votes from your most recent season.'>
              <Button
                className='o-action'
                onClick={this.resetFromVotes.bind(this)}
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
          <ReorderableVotingList
            onUpdate={this.onListUpdate.bind(this)}
          >
            {this.renderVoteRows(books)}
          </ReorderableVotingList> : null}
      </div>
    );
  }

  renderVoteRows(books = []) {
    return books.filter(book => !!book).map((book, i) =>
      book.isDivider ?
        <VoteCardDivider key={book._id} />
      :
      <VoteCardRank
        key={book._id}
        i={i}
        rank={rankValueForAcceptance(i, books)}
        maxRank={books.length - 1}
        book={book}
        isResetAdded={this.state.resetAddedBookIds.indexOf(toBookId(book)) > -1}
        onVote={this.onVote.bind(this)}
      />
    );
  }

  onListUpdate(list) {
    const books = mapReorderableListToAcceptanceBooks(list, this.props.books);
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
      await this.resetFromVotes();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.votingSession !== this.props.votingSession
      || prevProps.books !== this.props.books
      || prevProps.myId !== this.props.myId
    ) {
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

  onVote(book, rank) {
    const books = moveAcceptanceBookToRank(this.state.books, book, rank);
    this.persistVoteOrderDraft(books);
    this.setState({
      books,
      enabled: true,
    });
  }

  async resetFromVotes() {
    const votingSession = hydrateVotingSession(this.props.votingSession, this.props.books, this.props.users);
    if (hasUserVoted(votingSession.votes, this.props.myId)) {
      const books = extractAcceptanceBookList(this.props);
      this.persistVoteOrderDraft(books, []);
      this.setState({
        books,
        enabled: true,
        resetAddedBookIds: [],
      });
      return;
    }

    const latestVotingSession = await this.props.fetchLatestWithUserVotes();
    const previousSession = latestVotingSession || this.props.latestVotingSession;
    const resetBooks = buildAcceptanceResetBooks({
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
      extractAcceptanceBookList(props),
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
      shouldIgnoreBook: (book) => !!book && !!book.isDivider,
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

export const VotingSessionAdvancedAcceptanceContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(VotingSessionAdvancedAcceptanceContainer_);
