import * as React from 'react';
import { connect } from 'react-redux';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Config from 'config';
import { BookStatus } from 'types';
import SeasonClient from 'clients/SeasonClient';
import VotingSessionClient from 'clients/VotingSessionClient';
import BookClient from 'clients/BookClient';
import { UserActions } from 'actions/UserActions';
import { BookActions } from 'actions/BookActions';
import {
  buildDeletePreview as buildDeletePreviewData,
  buildTransferItemsWithData as buildTransferItemsData,
  getRefId,
  getTransferTargetCandidates,
  getUsersWithStats,
  isAdminUser,
  sortUsersByRoleAndRecentSeason,
} from 'components/pages/users-page-utils';
import { toMuiButtonColor } from 'components/display/button-colors';
import { responsiveDropdownFormControlSx } from 'components/form-control-sx';

const usersTableSx = {
  width: '100%',
  '& th, & td': {
    border: '1px solid',
    borderColor: 'divider',
    px: 1,
    py: 1,
    textAlign: 'left',
    verticalAlign: 'top',
  },
  '& thead th': {
    backgroundColor: 'grey.100',
    fontWeight: 600,
  },
  '& tbody tr:nth-of-type(even)': {
    backgroundColor: 'grey.50',
  },
};

const transferTableSx = {
  width: '100%',
  mt: 1,
  '& th, & td': {
    border: '1px solid',
    borderColor: 'divider',
    px: 1,
    py: 0.75,
    textAlign: 'left',
    verticalAlign: 'top',
  },
  '& thead th': {
    backgroundColor: 'grey.50',
  },
};

class UsersPage_ extends React.Component<any, any> {
  state = {
    seasons: {},
    votingSessions: {},
    loading: false,
    error: '',
    manageDialogOpen: false,
    manageUserId: '',
    transferTargetUserId: '',
    transferItems: [],
    transferApplying: false,
    transferError: '',
    transferSummary: '',
    deleteApplying: false,
    deleteError: '',
  };

  componentDidMount() {
    if (!this.props.isAdmin) {
      return;
    }
    this.loadAuxData();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isAdmin && this.props.isAdmin) {
      this.loadAuxData();
    }
  }

  loadAuxData() {
    this.setState({
      loading: true,
      error: '',
    });
    Promise.all([
      SeasonClient.fetchAll(),
      VotingSessionClient.fetchAll(),
    ])
      .then(([seasons, votingSessions]) => {
        this.setState({
          seasons: seasons || {},
          votingSessions: votingSessions || {},
          loading: false,
        });
      })
      .catch(() => {
        this.setState({
          loading: false,
          error: 'Failed to load user debug data.',
        });
      });
  }

  render() {
    if (!this.props.isAdmin) {
      return (
        <Container maxWidth={false} disableGutters sx={{ px: 2, py: 1 }}>
          <Typography variant='h4'>Users</Typography>
          <Typography variant='body1'>Admin access required.</Typography>
        </Container>
      );
    }

    const users = sortUsersByRoleAndRecentSeason(
      getUsersWithStats(
        this.props.users || {},
        this.props.books || {},
        this.state.seasons || {},
        this.state.votingSessions || {},
      ),
    );

    return (
      <Container maxWidth={false} disableGutters sx={{ px: 2, py: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h4'>Users</Typography>
        </Box>
        {this.state.loading ? <Typography variant='body1'>Loading...</Typography> : null}
        {this.state.error ? <Typography variant='body1'>{this.state.error}</Typography> : null}
        <TableContainer component={Paper} sx={{ mt: 1.5 }}>
          <Table size='small' sx={usersTableSx}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Suggested Books</TableCell>
                <TableCell>Winning Books</TableCell>
                <TableCell>Books Rated</TableCell>
                <TableCell>Seasons Voted</TableCell>
                <TableCell>Most Recent Season Voted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(({ user, booksSuggestedCount, winningBooksCount, booksRatedCount, seasonsVotedCount, lastSeasonTitle, lastSeasonDateRange }) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name || '--'}</TableCell>
                  <TableCell>{user._id || '--'}</TableCell>
                  <TableCell>{isAdminUser(user) ? 'ADMIN' : 'MEMBER'}</TableCell>
                  <TableCell>{booksSuggestedCount}</TableCell>
                  <TableCell>{winningBooksCount}</TableCell>
                  <TableCell>{booksRatedCount}</TableCell>
                  <TableCell>{seasonsVotedCount}</TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant='body2'>{lastSeasonTitle}</Typography>
                      <Typography variant='body2'>{lastSeasonDateRange}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button color='primary' onClick={() => this.openManageDialog(user._id)}>
                      Migrate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {this.renderManageDialog()}
      </Container>
    );
  }

  renderManageDialog() {
    const {
      manageDialogOpen,
      manageUserId,
      transferTargetUserId,
      transferItems,
      transferApplying,
      transferError,
      transferSummary,
      deleteApplying,
      deleteError,
    } = this.state;
    const sourceUser = this.props.users[manageUserId];
    const targetCandidates = getTransferTargetCandidates(this.props.users || {}, manageUserId);
    const selectedCount = transferItems.filter((item) => item.checked).length;
    const transferTargetUserLabelId = 'transfer-target-user-label';
    const deleteDisabledReason = this.getDeleteDisabledReason(manageUserId);
    const canDelete = !!manageUserId && !deleteDisabledReason;
    const hasTransferableRecords = this.userHasTransferableRecordsForUser(manageUserId);

    return (
      <Dialog
        open={manageDialogOpen}
        onClose={this.closeManageDialog.bind(this)}
        aria-labelledby='manage-user-dialog-title'
        fullWidth
        maxWidth='md'
      >
        <DialogTitle id='manage-user-dialog-title'>Migrate User</DialogTitle>
        <DialogContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent='space-between'
            sx={{ mb: 1 }}
          >
            <Typography variant='body2'><strong>From:</strong> {sourceUser ? `${sourceUser.name} (${sourceUser._id})` : '--'}</Typography>
            <FormControl sx={responsiveDropdownFormControlSx}>
              <InputLabel id={transferTargetUserLabelId}>To User</InputLabel>
              <Select
                id='transfer-target-user'
                labelId={transferTargetUserLabelId}
                label='To User'
                name='transferTargetUserId'
                value={transferTargetUserId}
                onChange={this.handleTransferTargetChange.bind(this)}
              >
                {targetCandidates.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user._id}) {isAdminUser(user) ? '(ADMIN)' : '(MEMBER)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {!hasTransferableRecords ? (
            <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>
              This user has no suggested books, winning books, ratings, or season votes to transfer.
            </Typography>
          ) : null}
          <Box sx={{ mb: 1 }}>
            <Typography variant='body2'>Selected line items: {selectedCount} / {transferItems.length}</Typography>
          </Box>
          {this.renderTransferItemsTable(transferItems, {
            showCheckboxes: true,
            onToggle: this.toggleTransferItem.bind(this),
            emptyMessage: 'Choose a target user to load transferable items.',
          })}
          {transferError ? <Typography variant='body1' sx={{ mt: 1, color: 'error.dark' }}>{transferError}</Typography> : null}
          {transferSummary ? <Typography variant='body1' sx={{ mt: 1, color: 'success.dark' }}>{transferSummary}</Typography> : null}
          {deleteError ? <Typography variant='body1' sx={{ mt: 1, color: 'error.dark' }}>{deleteError}</Typography> : null}
        </DialogContent>
        <DialogActions>
          <Button
            color='primary'
            onClick={this.closeManageDialog.bind(this)}
            disabled={transferApplying || deleteApplying}
          >
            Close
          </Button>
          <Button
            color='secondary'
            onClick={this.applyTransfer.bind(this)}
            disabled={transferApplying || deleteApplying || !transferTargetUserId || selectedCount < 1}
          >
            {transferApplying ? 'Transferring...' : 'Transfer Selected'}
          </Button>
          <Tooltip title={deleteDisabledReason || ''}>
            <span>
              <Button
                color={toMuiButtonColor('danger')}
                onClick={this.applyDelete.bind(this)}
                disabled={transferApplying || deleteApplying || !canDelete}
              >
                {deleteApplying ? 'Deleting...' : 'Delete User'}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    );
  }

  openManageDialog(userId) {
    this.setState({
      manageDialogOpen: true,
      manageUserId: userId,
      transferTargetUserId: '',
      transferItems: [],
      transferApplying: false,
      transferError: '',
      transferSummary: '',
      deleteApplying: false,
      deleteError: '',
    });
  }

  closeManageDialog() {
    this.setState({
      manageDialogOpen: false,
      manageUserId: '',
      transferTargetUserId: '',
      transferItems: [],
      transferApplying: false,
      transferError: '',
      transferSummary: '',
      deleteApplying: false,
      deleteError: '',
    });
  }

  handleTransferTargetChange(event) {
    const transferTargetUserId = event.target.value;
    const transferItems = this.buildTransferItems(this.state.manageUserId, transferTargetUserId);
    this.setState({
      transferTargetUserId,
      transferItems,
      transferError: '',
      transferSummary: '',
      deleteError: '',
    });
  }

  toggleTransferItem(index) {
    const transferItems = this.state.transferItems.slice(0);
    transferItems[index] = {
      ...transferItems[index],
      checked: !transferItems[index].checked,
    };
    this.setState({ transferItems });
  }

  renderTransferItemsTable(transferItems = [], {
    showCheckboxes = false,
    onToggle = null,
    emptyMessage = 'No items found.',
  } = {}) {
    const columnCount = showCheckboxes ? 4 : 3;

    return (
      <TableContainer component={Paper}>
        <Table size='small' sx={transferTableSx}>
          <TableHead>
            <TableRow>
              {showCheckboxes ? <TableCell>Use</TableCell> : null}
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Conflicts</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transferItems.map((item, i) => (
              <TableRow key={item.id}>
                {showCheckboxes ? (
                  <TableCell>
                    <Checkbox
                      checked={!!item.checked}
                      onChange={() => onToggle && onToggle(i)}
                      color='primary'
                    />
                  </TableCell>
                ) : null}
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell sx={{ color: item.conflict ? 'error.dark' : 'success.dark' }}>
                  {item.conflict ? `Conflict: ${item.conflictReason}` : 'OK'}
                </TableCell>
              </TableRow>
            ))}
            {transferItems.length < 1 ? (
              <TableRow>
                <TableCell colSpan={columnCount}>{emptyMessage}</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  buildTransferItems(sourceUserId, targetUserId) {
    return buildTransferItemsData(
      sourceUserId,
      targetUserId,
      this.props.books || {},
      this.state.seasons || {},
      this.state.votingSessions || {},
    );
  }

  async applyTransfer() {
    const sourceUserId = this.state.manageUserId;
    const targetUserId = this.state.transferTargetUserId;
    const selected = this.state.transferItems.filter((item) => item.checked);
    if (!sourceUserId || !targetUserId || selected.length < 1) {
      return;
    }

    this.setState({
      transferApplying: true,
      transferError: '',
      transferSummary: '',
      deleteError: '',
    });

    try {
      const selectedBooks = selected.filter((item) =>
        item.type === 'BOOK_SUGGESTED' || item.type === 'BOOK_WINNING'
      );
      const selectedBookRatings = selected.filter((item) => item.type === 'BOOK_RATING');
      for (const item of selectedBooks) {
        await BookClient.update(item.bookId, {
          suggestedBy: targetUserId,
        });
      }
      for (const item of selectedBookRatings) {
        const sourceBook = this.props.books[item.bookId];
        if (!sourceBook) {
          continue;
        }
        const ratings = Array.isArray(sourceBook.ratings) ? sourceBook.ratings : [];
        const sourceRating = ratings.find((rating) => getRefId(rating.user) === sourceUserId);
        if (!sourceRating) {
          continue;
        }
        const nextRatings = ratings
          .filter((rating) => {
            const ratingUserId = getRefId(rating.user);
            return ratingUserId !== sourceUserId && ratingUserId !== targetUserId;
          })
          .concat({
            ...sourceRating,
            user: targetUserId,
          });
        await BookClient.update(item.bookId, {
          ratings: nextRatings,
        });
      }

      const selectedVotesBySession = selected
        .filter((item) => item.type === 'SEASON_VOTES')
        .reduce((map, item) => {
          if (!map[item.sessionId]) {
            map[item.sessionId] = [];
          }
          map[item.sessionId].push(item);
          return map;
        }, {});

      const sessionIds = Object.keys(selectedVotesBySession);
      for (const sessionId of sessionIds) {
        const sourceSession = this.state.votingSessions[sessionId];
        if (!sourceSession) {
          continue;
        }
        const votes = (Array.isArray(sourceSession.votes) ? sourceSession.votes : []).slice(0);
        const sourceVotes = votes.filter((vote) => getRefId(vote.user) === sourceUserId);
        const preservedVotes = votes.filter((vote) => {
          const uid = getRefId(vote.user);
          return uid !== sourceUserId && uid !== targetUserId;
        });
        const transferredVotes = sourceVotes.map((vote) => ({
          ...vote,
          user: targetUserId,
        }));
        const mergedVotes = [...preservedVotes, ...transferredVotes];
        await VotingSessionClient.update(sessionId, { votes: mergedVotes });
      }

      const books = await BookClient.fetchAll();
      const seasons = await SeasonClient.fetchAll();
      const votingSessions = await VotingSessionClient.fetchAll();
      await this.props.refreshCoreData();
      const previousCheckedById = this.state.transferItems.reduce((map, item) => {
        map[item.id] = !!item.checked;
        return map;
      }, {});
      const nextTransferItems = buildTransferItemsData(
        sourceUserId,
        targetUserId,
        books || {},
        seasons || {},
        votingSessions || {},
      ).map((item) => {
        if (Object.prototype.hasOwnProperty.call(previousCheckedById, item.id)) {
          return {
            ...item,
            checked: previousCheckedById[item.id],
          };
        }
        return item;
      });
      this.setState({
        seasons: seasons || {},
        votingSessions: votingSessions || {},
        transferApplying: false,
        transferItems: nextTransferItems,
        transferSummary: `Transferred ${selectedBooks.length} books, ${selectedBookRatings.length} book rating(s), and ${selected.filter((item) => item.type === 'SEASON_VOTES').length} season vote record(s).`,
      });
    } catch (err) {
      this.setState({
        transferApplying: false,
        transferError: 'Transfer failed. Check server logs and try again.',
      });
    }
  }

  buildDeletePreview(userId) {
    return buildDeletePreviewData(
      userId,
      this.props.books || {},
      this.state.seasons || {},
      this.state.votingSessions || {},
    );
  }

  userHasSeasonVotes(userId) {
    return Object.keys(this.state.votingSessions || {}).some((sessionId) => {
      const session = this.state.votingSessions[sessionId];
      const votes = Array.isArray(session && session.votes) ? session.votes : [];
      return votes.some((vote) => getRefId(vote.user) === userId);
    });
  }

  userHasWinningBooks(userId) {
    return Object.keys(this.props.books || {}).some((bookId) => {
      const book = this.props.books[bookId];
      if (!book) {
        return false;
      }
      return getRefId(book.suggestedBy) === userId
        && (book.status === BookStatus.READING || book.status === BookStatus.FINISHED);
    });
  }

  getDeleteDisabledReason(userId) {
    if (this.userHasSeasonVotes(userId)) {
      return 'Cannot delete users with season votes. Transfer the votes to another user first.';
    }
    if (this.userHasWinningBooks(userId)) {
      return 'Cannot delete users with winning books. Transfer the books to another user first.';
    }
    return '';
  }

  userHasTransferableRecords({
    booksSuggestedCount = 0,
    winningBooksCount = 0,
    booksRatedCount = 0,
    seasonsVotedCount = 0,
  } = {}) {
    return booksSuggestedCount > 0
      || winningBooksCount > 0
      || booksRatedCount > 0
      || seasonsVotedCount > 0;
  }

  userHasTransferableRecordsForUser(userId) {
    if (!userId || !this.props.users[userId]) {
      return false;
    }
    const userStats = getUsersWithStats(
      { [userId]: this.props.users[userId] },
      this.props.books || {},
      this.state.seasons || {},
      this.state.votingSessions || {},
    )[0];
    return this.userHasTransferableRecords(userStats || {});
  }

  async applyDelete() {
    const deleteUserId = this.state.manageUserId;
    if (!deleteUserId || this.getDeleteDisabledReason(deleteUserId)) {
      return;
    }

    this.setState({
      deleteApplying: true,
      deleteError: '',
      transferError: '',
    });

    try {
      const preview = this.buildDeletePreview(deleteUserId);

      for (const book of preview.books) {
        await BookClient.delete(book._id);
      }

      const deletedBookIds = new Set((preview.books || []).map((book) => book && book._id).filter((id) => !!id));
      const remainingBooks = Object.keys(this.props.books || {})
        .map((id) => this.props.books[id])
        .filter((book) => !!book && !deletedBookIds.has(book._id));

      for (const book of remainingBooks) {
        const ratings = Array.isArray(book.ratings) ? book.ratings : [];
        const remainingRatings = ratings.filter((rating) => getRefId(rating.user) !== deleteUserId);
        if (remainingRatings.length !== ratings.length) {
          await BookClient.update(book._id, { ratings: remainingRatings });
        }
      }

      const response = await fetch(`${Config.API_HOST}/api/users/${deleteUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.status !== 204) {
        throw new Error(`Failed deleting user: status ${response.status}`);
      }

      await this.props.refreshCoreData();
      this.loadAuxData();
      this.closeManageDialog();
    } catch (err) {
      this.setState({
        deleteApplying: false,
        deleteError: 'Delete failed. Check server logs and try again.',
      });
    }
  }
}

const mapStateToProps = (state: any) => {
  return {
    users: (state.users && state.users.users) || {},
    books: state.books || {},
    isAdmin: state.users && state.users.isAdmin,
  };
};

export const UsersPage = connect(
  mapStateToProps,
  (dispatch: any) => ({
    refreshCoreData() {
      return Promise.all([
        dispatch(UserActions.fetchAllUsers()),
        dispatch(BookActions.fetchBookList()),
      ]);
    },
  }),
)(UsersPage_);
