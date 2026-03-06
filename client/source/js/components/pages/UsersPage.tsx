import * as React from 'react';
import { connect } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Config from 'config';
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

class UsersPage_ extends React.Component<any, any> {
  state = {
    seasons: {},
    votingSessions: {},
    loading: false,
    error: '',
    transferDialogOpen: false,
    transferSourceUserId: '',
    transferTargetUserId: '',
    transferItems: [],
    transferApplying: false,
    transferError: '',
    transferSummary: '',
    deleteDialogOpen: false,
    deleteUserId: '',
    deletePreview: null,
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
      .catch((err) => {
        this.setState({
          loading: false,
          error: 'Failed to load user debug data.',
        });
      });
  }

  render() {
    if (!this.props.isAdmin) {
      return (
        <div className='l-users-page'>
          <Typography variant='h4'>Users</Typography>
          <Typography variant='body1'>Admin access required.</Typography>
        </div>
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
      <div className='l-users-page'>
        <div className='o-action-title'>
          <Typography variant='h4'>Users</Typography>
        </div>
        {this.state.loading ? <Typography variant='body1'>Loading...</Typography> : null}
        {this.state.error ? <Typography variant='body1'>{this.state.error}</Typography> : null}
        <TableContainer component={Paper} className='c-users-page-table'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Suggested Books</TableCell>
                <TableCell>Seasons Voted</TableCell>
                <TableCell>Most Recent Season Voted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(({ user, booksSuggestedCount, seasonsVotedCount, lastSeasonTitle, lastSeasonDateRange }) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name || '--'}</TableCell>
                  <TableCell>{user._id || '--'}</TableCell>
                  <TableCell>{isAdminUser(user) ? 'ADMIN' : 'MEMBER'}</TableCell>
                  <TableCell>{booksSuggestedCount}</TableCell>
                  <TableCell>{seasonsVotedCount}</TableCell>
                  <TableCell>
                    <div>{lastSeasonTitle}</div>
                    <div>{lastSeasonDateRange}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      color='primary'
                      onClick={() => this.openTransferDialog(user._id)}
                    >
                      Transfer
                    </Button>
                    <Button
                      color='secondary'
                      onClick={() => this.openDeleteDialog(user._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {this.renderTransferDialog()}
        {this.renderDeleteDialog()}
      </div>
    );
  }

  renderTransferDialog() {
    const {
      transferDialogOpen,
      transferSourceUserId,
      transferTargetUserId,
      transferItems,
      transferApplying,
      transferError,
      transferSummary,
    } = this.state;
    const sourceUser = this.props.users[transferSourceUserId];
    const targetCandidates = getTransferTargetCandidates(this.props.users || {}, transferSourceUserId);
    const selectedCount = transferItems.filter((item) => item.checked).length;

    return (
      <Dialog
        open={transferDialogOpen}
        onClose={this.closeTransferDialog.bind(this)}
        aria-labelledby='transfer-user-dialog-title'
        fullWidth
        maxWidth='md'
      >
        <DialogTitle id='transfer-user-dialog-title'>
          Transfer Records
        </DialogTitle>
        <DialogContent>
          <div className='c-users-transfer-dialog__meta'>
            <div><strong>From:</strong> {sourceUser ? `${sourceUser.name} (${sourceUser._id})` : '--'}</div>
            <FormControl className='o-field o-field--dropdown c-users-transfer-dialog__target'>
              <InputLabel htmlFor='transfer-target-user'>To User</InputLabel>
              <Select
                value={transferTargetUserId}
                onChange={this.handleTransferTargetChange.bind(this)}
                inputProps={{
                  id: 'transfer-target-user',
                  name: 'transferTargetUserId',
                }}
              >
                {targetCandidates.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user._id}) {isAdminUser(user) ? '(ADMIN)' : '(MEMBER)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className='c-users-transfer-dialog__summary'>
            <span>Selected line items: {selectedCount} / {transferItems.length}</span>
          </div>
          <TableContainer component={Paper} className='c-users-transfer-table'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Use</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Conflicts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferItems.map((item, i) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={!!item.checked}
                        onChange={() => this.toggleTransferItem(i)}
                        color='primary'
                      />
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className={item.conflict ? 'is-conflict' : 'is-ok'}>
                      {item.conflict ? `Conflict: ${item.conflictReason}` : 'OK'}
                    </TableCell>
                  </TableRow>
                ))}
                {transferItems.length < 1 ? (
                  <TableRow>
                    <TableCell colSpan={4}>Choose a target user to load transferable items.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
          {transferError ? <Typography variant='body1' className='c-users-transfer-dialog__error'>{transferError}</Typography> : null}
          {transferSummary ? <Typography variant='body1' className='c-users-transfer-dialog__summary-text'>{transferSummary}</Typography> : null}
        </DialogContent>
        <DialogActions>
          <Button color='primary' onClick={this.closeTransferDialog.bind(this)} disabled={transferApplying}>Cancel</Button>
          <Button
            color='secondary'
            onClick={this.applyTransfer.bind(this)}
            disabled={transferApplying || !transferTargetUserId || selectedCount < 1}
          >
            {transferApplying ? 'Transferring...' : 'Transfer Selected'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  renderDeleteDialog() {
    const {
      deleteDialogOpen,
      deleteUserId,
      deletePreview,
      deleteApplying,
      deleteError,
    } = this.state;
    const user = this.props.users[deleteUserId];
    const books = deletePreview && Array.isArray(deletePreview.books) ? deletePreview.books : [];
    const voteItems = deletePreview && Array.isArray(deletePreview.voteItems) ? deletePreview.voteItems : [];
    const voteTotal = voteItems.reduce((sum, item) => sum + (item.count || 0), 0);

    return (
      <Dialog
        open={deleteDialogOpen}
        onClose={this.closeDeleteDialog.bind(this)}
        aria-labelledby='delete-user-dialog-title'
        fullWidth
        maxWidth='md'
      >
        <DialogTitle id='delete-user-dialog-title'>
          Delete User
        </DialogTitle>
        <DialogContent>
          <Typography variant='body1'>
            Delete <strong>{user ? `${user.name} (${user._id})` : deleteUserId}</strong>?
          </Typography>
          <Typography variant='body1'>
            The following records will be cleaned up first.
          </Typography>
          <div className='c-users-delete-dialog__section'>
            <Typography variant='h6'>Suggested Books ({books.length})</Typography>
            {books.length > 0 ? (
              <Typography variant='body1'>
                {books.map((book) => `${book.title || '--'} by ${book.author || '--'} (${book._id})`).join(', ')}
              </Typography>
            ) : (
              <Typography variant='body1'>None</Typography>
            )}
          </div>
          <div className='c-users-delete-dialog__section'>
            <Typography variant='h6'>Votes To Remove ({voteTotal})</Typography>
            {voteItems.length > 0 ? (
              <Typography variant='body1'>
                {voteItems.map((item) => `${item.seasonLabel}: ${item.count} vote(s)`).join(', ')}
              </Typography>
            ) : (
              <Typography variant='body1'>None</Typography>
            )}
          </div>
          {deleteError ? <Typography variant='body1' className='c-users-transfer-dialog__error'>{deleteError}</Typography> : null}
        </DialogContent>
        <DialogActions>
          <Button color='primary' onClick={this.closeDeleteDialog.bind(this)} disabled={deleteApplying}>Cancel</Button>
          <Button color='secondary' onClick={this.applyDelete.bind(this)} disabled={deleteApplying}>
            {deleteApplying ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  openTransferDialog(sourceUserId) {
    this.setState({
      transferDialogOpen: true,
      transferSourceUserId: sourceUserId,
      transferTargetUserId: '',
      transferItems: [],
      transferApplying: false,
      transferError: '',
      transferSummary: '',
    });
  }

  closeTransferDialog() {
    this.setState({
      transferDialogOpen: false,
      transferSourceUserId: '',
      transferTargetUserId: '',
      transferItems: [],
      transferApplying: false,
      transferError: '',
      transferSummary: '',
    });
  }

  handleTransferTargetChange(event) {
    const transferTargetUserId = event.target.value;
    const transferItems = this.buildTransferItems(this.state.transferSourceUserId, transferTargetUserId);
    this.setState({
      transferTargetUserId,
      transferItems,
      transferError: '',
      transferSummary: '',
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
    const sourceUserId = this.state.transferSourceUserId;
    const targetUserId = this.state.transferTargetUserId;
    const selected = this.state.transferItems.filter((item) => item.checked);
    if (!sourceUserId || !targetUserId || selected.length < 1) {
      return;
    }

    this.setState({
      transferApplying: true,
      transferError: '',
      transferSummary: '',
    });

    try {
      const selectedBooks = selected.filter((item) => item.type === 'BOOK');
      for (const item of selectedBooks) {
        await BookClient.update(item.bookId, {
          suggestedBy: targetUserId,
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
        transferSummary: `Transferred ${selectedBooks.length} books and ${selected.filter((item) => item.type === 'SEASON_VOTES').length} season vote record(s).`,
      });
    } catch (err) {
      this.setState({
        transferApplying: false,
        transferError: 'Transfer failed. Check server logs and try again.',
      });
    }
  }

  openDeleteDialog(userId) {
    this.setState({
      deleteDialogOpen: true,
      deleteUserId: userId,
      deletePreview: this.buildDeletePreview(userId),
      deleteApplying: false,
      deleteError: '',
    });
  }

  closeDeleteDialog() {
    this.setState({
      deleteDialogOpen: false,
      deleteUserId: '',
      deletePreview: null,
      deleteApplying: false,
      deleteError: '',
    });
  }

  buildDeletePreview(userId) {
    return buildDeletePreviewData(
      userId,
      this.props.books || {},
      this.state.seasons || {},
      this.state.votingSessions || {},
    );
  }

  async applyDelete() {
    const deleteUserId = this.state.deleteUserId;
    if (!deleteUserId) {
      return;
    }

    this.setState({
      deleteApplying: true,
      deleteError: '',
    });

    try {
      const preview = this.buildDeletePreview(deleteUserId);

      for (const voteItem of preview.voteItems) {
        const session = this.state.votingSessions[voteItem.sessionId];
        if (!session) {
          continue;
        }
        const votes = Array.isArray(session.votes) ? session.votes : [];
        const remainingVotes = votes.filter((vote) => getRefId(vote.user) !== deleteUserId);
        await VotingSessionClient.update(voteItem.sessionId, { votes: remainingVotes });
      }

      for (const book of preview.books) {
        await BookClient.delete(book._id);
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
      this.setState({
        deleteDialogOpen: false,
        deleteUserId: '',
        deletePreview: null,
        deleteApplying: false,
        deleteError: '',
      });
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
