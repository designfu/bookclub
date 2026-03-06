import * as React from 'react';
import Paper from '@mui/material/Paper';
import { BookStatus, Season, VotingSession, VotingSessionStatus } from 'types';
import { BookCard } from 'components/display/BookCard';
import { SeasonInfoBase } from 'components/display/SeasonInfoBase';
import { VoteResultCardAcceptance } from 'components/display/VoteResultCardAcceptance';
import {
  ensureSeasonInfoProps,
} from 'components/display/season-info-common';

function rankingsForBookFromVoting(book, votingSession) {
  if(votingSession.status !== VotingSessionStatus.COMPLETE) return;
  const vote = votingSession.results.find(_ => _.book === book._id);
  return vote ? vote.rankings : [];
}

function voteResultsList(books = {}, votingSession: VotingSession, seasonBook = {}) {
  const {
    results,
    booksVotedOn,
  } = {
    results: [],
    booksVotedOn: [],
    ...votingSession
  };
  const toId = (value) => value && value.toString ? value.toString() : value;
  const chosenBookId = toId((seasonBook as any) && ((seasonBook as any)._id || seasonBook));
  const topResultBookId = results[0] ? toId(results[0].book) : null;
  const list = (booksVotedOn && booksVotedOn.length > 0 ? booksVotedOn : Object.keys(books))
    .filter(bookId => books[bookId])
    .map(bookId => {
      const book = books[bookId];
      const result = results.find(_ => _.book === book._id);
      book.rankings = result ? result.rankings : [];
      return book;
    })
    .filter(_ => (booksVotedOn.length > 0 || _.status !== BookStatus.BACKLOG) && _._id)
    .sort((a, b) => {
      const diff = b.rankings.length - a.rankings.length;
      if (diff > 0) {
        return 1;
      }
      if (diff < 0) {
        return -1;
      }

      const maxRank = Math.max(
        a.rankings[a.rankings.length - 1],
        b.rankings[b.rankings.length - 1],
      );

      for(let rank = 0; rank <= maxRank; rank++) {
        const aVotesAtRank = a.rankings.filter(vote => vote === rank).length;
        const bVotesAtRank = b.rankings.filter(vote => vote === rank).length;
        const votesAtRankDiff = bVotesAtRank - aVotesAtRank;

        if (votesAtRankDiff > 0) {
          return 1;
        }
        if (votesAtRankDiff < 0) {
          return -1;
        }
      }

      return 0;
    });
  return chosenBookId && chosenBookId === topResultBookId
    ? list.filter(_ => toId(_._id) !== chosenBookId)
    : list;
}

export interface SeasonInfoAcceptanceProps {
  season: Season;
  votingSession: VotingSession;
  onSeasonClose: Function;
  onSeasonRename?: Function;
  onSeasonDelete?: Function;
  onRateBook?: Function;
  allowClosing: boolean;
  title: string;
  books?: any;
  startVotingOpen?: boolean;
  myId?: any;
  hideBookPitch?: boolean;
  hideBookBadges?: boolean;
  seasonNumber?: number;
  isSmallScreen?: boolean;
}

export class SeasonInfoAcceptance extends SeasonInfoBase {
  constructor(props) {
    super(props);
  }

  render() {
    const { season, votingSession, onSeasonRename, allowClosing, title } = ensureSeasonInfoProps(this.props);
    const { showJson, showVotingResults } = this.state;

    const isVotingSessionClosed = votingSession.status === VotingSessionStatus.COMPLETE;
    const showSystemBadge = !!votingSession.system;
    const allowToggleVotingResults = isVotingSessionClosed;
    const allowRenaming = !!onSeasonRename;
    const allowDeleting = !!this.props.onSeasonDelete;
    const allowRating = isVotingSessionClosed && !!this.props.myId && !!this.props.onRateBook;

    return (
      <div>
        <Paper className='c-season-info' elevation={1}>
          {this.renderSeasonHeader({
            title: season.title || title,
            systemBadgeLabel: showSystemBadge ? 'Acceptance + Ranked Tiebreaker' : undefined,
            systemBadgeTooltip: showSystemBadge
              ? 'Ranks by acceptance count, then uses ranked preference distributions to break ties.'
              : undefined,
          })}
          {this.renderSeasonDialogs()}

          {this.renderSeasonDetails(season)}
          {this.renderSeasonJson(showJson, season)}
          {season.book ?
            <div className='c-season-info__book'>
              <BookCard
                book={season.book}
                rankings={showVotingResults ? rankingsForBookFromVoting(season.book, votingSession) : undefined}
                myId={this.props.myId}
                borderless={true}
                hidePitch={this.props.hideBookPitch}
                hideBadges={this.props.hideBookBadges}
              />
            </div>
            : null}
          {this.renderSeasonActions({
            allowToggleVotingResults,
            showVotingResults,
            allowRating,
            allowRenaming,
            allowClosing,
            allowDeleting,
          })}
          {showVotingResults && isVotingSessionClosed ?
            <div className={this.votingResultsWrapClassName()}>
              <div className='c-season-info__voting-results'>
                {voteResultsList(this.props.books, votingSession, season.book).map((book, i) =>
                  <VoteResultCardAcceptance
                    key={i}
                    book={book}
                  />
                )}
              </div>
            </div>
            : null}
        </Paper>
      </div>
    );
  }

}
