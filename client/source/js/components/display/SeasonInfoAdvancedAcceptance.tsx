import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import { Season, VotingSession, VotingSessionStatus } from 'types';
import { BookCard } from 'components/display/BookCard';
import { SeasonInfoBase } from 'components/display/SeasonInfoBase';
import { VoteResultCardAdvancedAcceptance } from '@client/components/display/VoteResultCardAdvancedAcceptance';
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
  const resultsByBookId = results.reduce((acc, result) => ({
    ...acc,
    [toId(result.book)]: result,
  }), {});

  const rankedList = results
    .map(result => {
      const bookId = toId(result.book);
      const book = books[bookId];
      if(!book) {
        return null;
      }
      book.rankings = result.rankings || [];
      book.method = result.method || null;
      book.tiedCount = result.tiedCount || 1;
      return book;
    })
    .filter(_ => !!_ && _._id);

  if(rankedList.length > 0) {
    return chosenBookId && chosenBookId === topResultBookId
      ? rankedList.filter(_ => toId(_._id) !== chosenBookId)
      : rankedList;
  }

  const fallbackList = (booksVotedOn && booksVotedOn.length > 0 ? booksVotedOn : Object.keys(books))
    .map(toId)
    .filter(bookId => books[bookId])
    .map(bookId => {
      const book = books[bookId];
      const result = resultsByBookId[bookId];
      book.rankings = result ? result.rankings : [];
      book.method = result ? result.method : null;
      book.tiedCount = result ? result.tiedCount : 1;
      return book;
    })
    .filter(_ => _._id);

  return chosenBookId && chosenBookId === topResultBookId
    ? fallbackList.filter(_ => toId(_._id) !== chosenBookId)
    : fallbackList;
}

export interface SeasonInfoAdvancedAcceptanceProps {
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

export class SeasonInfoAdvancedAcceptance extends SeasonInfoBase {
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
        <Paper elevation={1} sx={{ pt: 1.25 }}>
          {this.renderSeasonHeader({
            title: season.title || title,
            systemBadgeLabel: showSystemBadge ? 'Advanced Acceptance' : undefined,
            systemBadgeTooltip: showSystemBadge
              ? 'Approves ranked choices, then resolves ties with instant-runoff and priority-based tiebreaks.'
              : undefined,
          })}
          {this.renderSeasonDialogs()}

          {this.renderSeasonDetails(season)}
          {this.renderSeasonJson(showJson, season)}
          {season.book ?
            <Box>
              <BookCard
                book={season.book}
                rankings={showVotingResults ? rankingsForBookFromVoting(season.book, votingSession) : undefined}
                myId={this.props.myId}
                borderless={true}
                hidePitch={this.props.hideBookPitch}
                hideBadges={this.props.hideBookBadges}
              />
            </Box>
            : null}
          {this.renderSeasonActions({
            allowToggleVotingResults,
            showVotingResults,
            allowRating,
            allowRenaming,
            allowClosing,
            allowDeleting,
          })}
          <Collapse in={showVotingResults && isVotingSessionClosed} timeout='auto' unmountOnExit>
            <Box sx={this.votingResultsWrapSx()}>
              <Box>
                {voteResultsList(this.props.books, votingSession, season.book).map((book, i) =>
                  <VoteResultCardAdvancedAcceptance
                    key={i}
                    book={book}
                    isSmallScreen={this.props.isSmallScreen}
                  />
                )}
              </Box>
            </Box>
          </Collapse>
        </Paper>
      </div>
    );
  }

}
