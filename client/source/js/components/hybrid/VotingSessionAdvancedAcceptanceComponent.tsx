import * as React from 'react';
import { connect } from 'react-redux';
import { VotingSessionActions, VotingSessionActionTypes } from 'actions/VotingSessionActions';
import { ReduxActions } from 'actions/ReduxActions';
import { VoteCardRank } from 'components/display/VoteCardRank';
import { VoteCardDivider } from 'components/display/VoteCardDivider';
import { CloseAdvancedAcceptanceVotingDialogButton } from 'components/display/CloseAdvancedAcceptanceVotingDialogButton';
import {
  buildAcceptanceResetBooks,
  extractAcceptanceBookList,
  mapReorderableListToAcceptanceBooks,
  moveAcceptanceBookToRank,
  rankValueForAcceptance,
} from 'utils/vote-reset-acceptance';
import {
  selectVotingSessionContainerState,
} from 'utils/voting-session-container';
import { toBookId } from 'utils/vote-reset-highlight';
import { VotingSessionContainerBase } from 'components/hybrid/VotingSessionContainerBase';

class VotingSessionAdvancedAcceptanceContainer_ extends VotingSessionContainerBase<any, any> {

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
        isNewlySuggested={this.state.newlySuggestedBookIds.indexOf(toBookId(book)) > -1}
        onVote={this.onVote.bind(this)}
      />
    );
  }

  renderCloseVotingButton(votingSession) {
    return (
      <CloseAdvancedAcceptanceVotingDialogButton
        onRef={(ref) => this.closeVotingDialog = ref}
        onConfirm={this.props.closeVotingSession.bind(this)}
        books={this.props.books}
        votes={votingSession.votes}
        results={votingSession.results}
      />
    );
  }

  extractBookList(props) {
    return extractAcceptanceBookList(props);
  }

  mapReorderableListToBooks(list) {
    return mapReorderableListToAcceptanceBooks(list, this.props.books);
  }

  onVote(book, rank) {
    const books = moveAcceptanceBookToRank(this.state.books, book, rank);
    this.persistVoteOrderDraft(books);
    this.setState({
      books,
      enabled: true,
    });
  }

  buildResetBooks(previousSession) {
    return buildAcceptanceResetBooks({
      books: this.state.books,
      latestVotingSession: previousSession,
      myId: this.props.myId,
    });
  }

  shouldIgnoreBookForNewlySuggestedIds() {
    return (book) => !!book && !!book.isDivider;
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
          newlySuggestedBookIds: [],
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
