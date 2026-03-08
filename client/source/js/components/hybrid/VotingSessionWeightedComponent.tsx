import * as React from 'react';
import { connect } from 'react-redux';
import Config from 'config';
import { VotingSessionActions, VotingSessionActionTypes } from 'actions/VotingSessionActions';
import { ReduxActions } from 'actions/ReduxActions';
import { VoteCard } from 'components/display/VoteCard';
import { CloseWeightedVotingDialogButton } from 'components/display/CloseWeightedVotingDialogButton';
import {
  buildWeightedResetBooks,
  extractWeightedBookList,
  mapReorderableListToWeightedBooks,
  moveWeightedBookToPoints,
} from 'utils/vote-reset-weighted';
import {
  selectVotingSessionContainerState,
} from 'utils/voting-session-container';
import { toBookId } from 'utils/vote-reset-highlight';
import { VotingSessionContainerBase } from 'components/hybrid/VotingSessionContainerBase';

const pointsFor = (i) => Math.max(Config.MAX_VOTES - i, 0);

class VotingSessionWeightedContainer_ extends VotingSessionContainerBase<any, any> {

  renderVoteRows(books = [], disablePitchTooltip = false) {
    return books.map((book, i) =>
      <VoteCard
        key={book._id}
        i={i}
        points={pointsFor(i)}
        book={book}
        isNewlySuggested={this.state.newlySuggestedBookIds.indexOf(toBookId(book)) > -1}
        disablePitchTooltip={disablePitchTooltip}
        onVote={this.onVote.bind(this)}
      />
    );
  }

  renderCloseVotingButton(votingSession) {
    return (
      <CloseWeightedVotingDialogButton
        onRef={(ref) => this.closeVotingDialog = ref}
        onConfirm={this.props.closeVotingSession.bind(this)}
        books={this.props.books}
        votes={votingSession.votes}
        results={votingSession.results}
      />
    );
  }

  extractBookList(props) {
    return extractWeightedBookList(props);
  }

  mapReorderableListToBooks(list) {
    return mapReorderableListToWeightedBooks(list, this.props.books);
  }

  onVote(book, points) {
    const books = moveWeightedBookToPoints(this.state.books, book, points, Config.MAX_VOTES);
    this.persistVoteOrderDraft(books);
    this.setState({
      books,
      enabled: true,
    });
  }

  buildResetBooks(previousSession) {
    return buildWeightedResetBooks({
      books: this.state.books,
      latestVotingSession: previousSession,
      myId: this.props.myId,
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

export const VotingSessionWeightedContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(VotingSessionWeightedContainer_);
