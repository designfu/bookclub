import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import { Season, VotingSession, VotingSessionStatus } from 'types';
import { BookCard } from 'components/display/BookCard';
import { SeasonInfoBase } from 'components/display/SeasonInfoBase';
import { VoteResultCardWeighted } from 'components/display/VoteResultCardWeighted';
import { excludeChosenWinner, resolveVoteResultBook } from 'components/display/season-vote-result-books';
import {
  ensureSeasonInfoProps,
} from 'components/display/season-info-common';

function pointsForBookFromVoting(book, votingSession) {
  if(votingSession.status !== VotingSessionStatus.COMPLETE) return;
  const vote = votingSession.results.find(_ => _.book === book._id);
  return vote ? vote.points : 0;
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
  const topResultBookId = results[0] ? toId(results[0].book) : null;
  const list = (booksVotedOn && booksVotedOn.length > 0 ? booksVotedOn : Object.keys(books))
    .map(bookId => {
      const book = resolveVoteResultBook(books, bookId);
      const result = results.find(_ => toId(_.book) === toId(bookId));
      return {
        ...book,
        points: result ? result.points : 0,
      };
    })
    .filter(_ => !!_ && !!_._id)
    .sort((a, b) => b.points - a.points);
  return excludeChosenWinner(list, seasonBook, topResultBookId);
}

export interface SeasonInfoWeightedProps {
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

export class SeasonInfoWeighted extends SeasonInfoBase {
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
            systemBadgeLabel: showSystemBadge ? 'Weighted 3x' : undefined,
            systemBadgeTooltip: showSystemBadge
              ? 'Assigns weighted points (3, 2, 1) to top choices and ranks by total points.'
              : undefined,
          })}
          {this.renderSeasonDialogs()}

          {this.renderSeasonDetails(season)}
          {this.renderSeasonJson(showJson, season)}
          {season.book ?
            <Box>
              <BookCard
                book={season.book}
                points={showVotingResults ? pointsForBookFromVoting(season.book, votingSession) : undefined}
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
                  <VoteResultCardWeighted
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
