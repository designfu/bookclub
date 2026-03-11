import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { VotingSessionStatus } from 'types';
import { ReorderableVotingList } from 'lib/reorderable-lists';
import { UserList } from 'components/display/UserList';
import {
  buildVotingParticipation,
  hasUserVoted,
  hydrateVotingSession,
} from 'utils/voting-session-container';
import {
  hasVoteOrderDraft,
  hydrateVoteOrderDraft,
  saveVoteOrderDraft,
} from 'utils/vote-order-draft';
import { computeNewlySuggestedBookIds, orderBooksByNewlySuggested } from 'utils/vote-reset-highlight';

const REORDER_STARTED_EVENT = 'vote-pitch-tooltip-reorder-started';
const REORDER_COMPLETE_EVENT = 'vote-pitch-tooltip-reorder-complete';

type VotingSessionContainerBaseState = {
  books: any[];
  enabled: boolean;
  newlySuggestedBookIds: any[];
  hasCompletedInitialBootstrap: boolean;
};

const votingSessionRootSx = {
  my: 1.25,
  maxWidth: 800,
  pb: 16.25,
};

const votingSessionActionsSx = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'nowrap',
  gap: 1.25,
  position: 'relative',
  zIndex: 10,
  width: '100%',
  maxWidth: 400,
  pr: 2,
};

const votingSessionListSx = {
  transition: 'opacity 160ms ease-out',
};

const votingSessionActionsLeftSx = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  gap: 1.25,
  minWidth: 0,
};

const savedVoteIndicatorSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  color: 'success.main',
  flexShrink: 0,
};

function shouldBootstrapVoteState(props) {
  const votingSession = hydrateVotingSession(props.votingSession, props.books, props.users);
  const hasCurrentVote = hasUserVoted(votingSession.votes, props.myId);
  const hasDraft = hasVoteOrderDraft(props.votingSession && props.votingSession._id, props.myId);
  return !hasCurrentVote && !hasDraft;
}

export abstract class VotingSessionContainerBase<
  P = any,
  S extends VotingSessionContainerBaseState = VotingSessionContainerBaseState,
> extends React.Component<P, S> {
  closeVotingDialog: any;

  constructor(props: P) {
    super(props);

    const { books, newlySuggestedBookIds } = this.booksAndResetIdsFromProps(props);
    this.state = {
      books,
      enabled: true,
      newlySuggestedBookIds,
      hasCompletedInitialBootstrap: false,
    } as S;
  }

  render() {
    const { books, enabled, hasCompletedInitialBootstrap } = this.state;
    const { users, isAdmin } = this.props as any;
    const booksMap = (this.props as any).books;
    const isOpen = (this.props as any).votingSession.status === VotingSessionStatus.OPEN;
    const votingSession = hydrateVotingSession((this.props as any).votingSession, booksMap, users);
    const hasVoted = hasUserVoted(votingSession.votes, (this.props as any).myId);
    const { usersHaveVoted, usersHaveNotVoted } = buildVotingParticipation(users, votingSession.votes);

    return (
      <Box sx={votingSessionRootSx}>
        {isAdmin ?
          <Box>
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
          </Box>
        : null}
        <Box sx={votingSessionActionsSx}>
          <Box sx={votingSessionActionsLeftSx}>
            {isOpen && !hasVoted ?
              <Button
                onClick={(this.props as any).castVotes.bind(this)}
                disabled={!enabled}
              >
                Cast Vote
              </Button>
            : null}
            {isOpen && hasVoted ?
              <Button
                onClick={(this.props as any).removeVotes.bind(this)}
              >
                Unvote
              </Button>
            : null}
            {isOpen ?
              <Tooltip title='Reset to votes from your most recent finished season.'>
                <Button onClick={this.resetFromVotes}>
                  Reset
                </Button>
              </Tooltip>
            : null}
            {isAdmin ? this.renderCloseVotingButton(votingSession) : null}
          </Box>
          <Fade in={isOpen && hasVoted && !enabled} mountOnEnter unmountOnExit timeout={180}>
            <Box sx={savedVoteIndicatorSx}>
              <CheckCircleIcon sx={{ fontSize: 18 }} />
              <Typography variant='body2' component='span' sx={{ color: 'inherit' }}>
                Saved
              </Typography>
            </Box>
          </Fade>
        </Box>
        {isOpen && hasCompletedInitialBootstrap ?
          <Box
            sx={votingSessionListSx}
          >
            <ReorderableVotingList
              onReorderStarted={this.onReorderStarted}
              onReorderComplete={this.onReorderComplete}
              onUpdate={this.onListUpdate}
            >
              {this.renderVoteRows(books)}
            </ReorderableVotingList>
          </Box> : null}
      </Box>
    );
  }

  async componentDidMount() {
    if (shouldBootstrapVoteState(this.props)) {
      await this.resetFromVotes();
    }
    this.setState({
      hasCompletedInitialBootstrap: true,
    } as Pick<S, keyof VotingSessionContainerBaseState>);
  }

  componentDidUpdate(prevProps: Readonly<P>) {
    if (
      (prevProps as any).votingSession !== (this.props as any).votingSession
      || (prevProps as any).books !== (this.props as any).books
      || (prevProps as any).myId !== (this.props as any).myId
    ) {
      const { books, newlySuggestedBookIds } = this.booksAndResetIdsFromProps(this.props);
      this.setState({
        books,
        newlySuggestedBookIds,
      } as Pick<S, 'books' | 'newlySuggestedBookIds'>);
    }
  }

  componentWillUnmount() {
    this.persistVoteOrderDraft(this.state.books);
  }

  onListUpdate = (list) => {
    const books = this.mapReorderableListToBooks(list);
    this.persistVoteOrderDraft(books);
    this.setState({
      books,
      enabled: true,
    } as Pick<S, 'books' | 'enabled'>);
  };

  onReorderStarted = () => {
    window.dispatchEvent(new Event(REORDER_STARTED_EVENT));
  };

  onReorderComplete = () => {
    window.dispatchEvent(new Event(REORDER_COMPLETE_EVENT));
    const props: any = this.props;
    const votingSession = hydrateVotingSession(props.votingSession, props.books, props.users);
    if (hasUserVoted(votingSession.votes, props.myId)) {
      props.castVotes.call(this);
    }
  };

  resetFromVotes = async () => {
    const props: any = this.props;
    const latestVotingSession = await props.fetchLatestWithUserVotes();
    const previousSession = latestVotingSession || props.latestVotingSession;
    const resetBooks = this.buildResetBooks(previousSession);
    const newlySuggestedBookIds = this.newlySuggestedIdsForBooks(resetBooks, previousSession);
    const books = orderBooksByNewlySuggested(resetBooks, newlySuggestedBookIds);
    this.persistVoteOrderDraft(books, newlySuggestedBookIds);
    this.setState({
      books,
      enabled: true,
      newlySuggestedBookIds,
    } as Pick<S, 'books' | 'enabled' | 'newlySuggestedBookIds'>);
  };

  booksAndResetIdsFromProps(props: P) {
    return hydrateVoteOrderDraft(
      (props as any).votingSession && (props as any).votingSession._id,
      (props as any).myId,
      this.extractBookList(props),
    );
  }

  persistVoteOrderDraft(books, newlySuggestedBookIds = this.state.newlySuggestedBookIds) {
    saveVoteOrderDraft(
      (this.props as any).votingSession && (this.props as any).votingSession._id,
      (this.props as any).myId,
      books,
      newlySuggestedBookIds,
    );
  }

  newlySuggestedIdsForBooks(books = [], previousSession = null) {
    const shouldIgnoreBook = this.shouldIgnoreBookForNewlySuggestedIds();
    return computeNewlySuggestedBookIds({
      localBooks: this.state.books,
      nextBooks: books,
      previousSession,
      ...(shouldIgnoreBook ? { shouldIgnoreBook } : {}),
    });
  }

  shouldIgnoreBookForNewlySuggestedIds() {
    return null;
  }

  abstract extractBookList(props: P): any[];
  abstract mapReorderableListToBooks(list: any[]): any[];
  abstract buildResetBooks(previousSession: any): any[];
  abstract renderVoteRows(books?: any[]): React.ReactNode;
  abstract renderCloseVotingButton(votingSession: any): React.ReactNode;
}
