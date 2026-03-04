import * as React from 'react';
import { Router, Route, Switch, browserHistory, withRouter } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import ListSubheader from '@material-ui/core/ListSubheader';
import { NavTab } from 'components/display/NavTab';
import { User } from 'types';

class HeaderContainer_ extends React.Component<any, any> {
  state = {
    anchorEl: null,
    switchDialogOpen: false,
    switchUserId: '',
  };

  constructor(props) {
    super(props);

    this.handleMenuOpen = this.handleMenuOpen.bind(this);
    this.handleMenuClose = this.handleMenuClose.bind(this);
    this.handleSignout = this.handleSignout.bind(this);
    this.handleSwitchUser = this.handleSwitchUser.bind(this);
    this.handleOpenSwitchDialog = this.handleOpenSwitchDialog.bind(this);
    this.handleCloseSwitchDialog = this.handleCloseSwitchDialog.bind(this);
    this.handleSwitchUserConfirm = this.handleSwitchUserConfirm.bind(this);
    this.handleSwitchUserChange = this.handleSwitchUserChange.bind(this);
  }

  render() {
    const { anchorEl, switchDialogOpen, switchUserId } = this.state;
    const { users } = this.props;
    const { myId } = users;
    const me: User = myId ? users.users[myId] : null;
    const switchableUsers = Object
      .keys(users.users || {})
      .map((id) => users.users[id])
      .filter((user: User) => !!user && user._id !== myId);
    const adminUsers = switchableUsers
      .filter((user: User) => Array.isArray(user.roles) && user.roles.indexOf('ADMIN') > -1)
      .sort((a: User, b: User) => (a.name || '').localeCompare(b.name || ''));
    const memberUsers = switchableUsers
      .filter((user: User) => !Array.isArray(user.roles) || user.roles.indexOf('ADMIN') === -1)
      .sort((a: User, b: User) => (a.name || '').localeCompare(b.name || ''));

    return (
      <header className='c-header'>
        <ul className='c-header__nav-tabs'>
          <NavTab to='/'>Voting</NavTab>
          <NavTab to='/books'>Books</NavTab>
          <NavTab to='/seasons'>Previous Seasons</NavTab>
          {users.isAdmin ? <NavTab to='/users'>Users</NavTab> : null}
        </ul>
        <div>
          {me
            ? (<div className='c-header__user' onClick={this.handleMenuOpen}>
                {me.avatar ? <img className='o-avatar' src={me.avatar} /> : null}
                <span>{me.name}</span>
              </div>
              )
            : <Button color='primary' href='/auth/google'>Sign in with Google</Button>
          }
          {me ? <Menu
            id='login-menu'
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={this.handleMenuClose}
          >
            {switchableUsers.length > 0 ? <MenuItem onClick={this.handleOpenSwitchDialog}>Switch User...</MenuItem> : null}
            <MenuItem onClick={this.handleSignout}>Sign Out</MenuItem>
          </Menu> : null}
          <Dialog
            open={switchDialogOpen}
            onClose={this.handleCloseSwitchDialog}
            aria-labelledby='switch-user-dialog-title'
          >
            <DialogTitle id='switch-user-dialog-title'>Switch Logged In User</DialogTitle>
            <DialogContent>
              <FormControl className='o-field o-field--dropdown'>
                <InputLabel htmlFor='switch-user-id'>User</InputLabel>
                <Select
                  value={switchUserId}
                  onChange={this.handleSwitchUserChange}
                  inputProps={{
                    name: 'switchUserId',
                    id: 'switch-user-id',
                  }}
                >
                  {adminUsers.length > 0 ? <ListSubheader>Admins</ListSubheader> : null}
                  {adminUsers.map((user: User) => (
                    <MenuItem key={user._id} value={user._id}>{user.name}</MenuItem>
                  ))}
                  {memberUsers.length > 0 ? <ListSubheader>Members</ListSubheader> : null}
                  {memberUsers.map((user: User) => (
                    <MenuItem key={user._id} value={user._id}>{user.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button color='primary' onClick={this.handleCloseSwitchDialog}>Cancel</Button>
              <Button color='secondary' onClick={this.handleSwitchUserConfirm} disabled={!switchUserId}>Switch</Button>
            </DialogActions>
          </Dialog>
        </div>
      </header>
    );
  }

  handleMenuOpen(event) {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleMenuClose() {
    this.setState({ anchorEl: null });
  }

  handleSignout() {
    this.handleMenuClose();
    window.location.href = '/auth/logout';
  }

  handleSwitchUser(userId: string) {
    this.handleMenuClose();
    window.location.href = `/auth/switch-user/${userId}`;
  }

  handleOpenSwitchDialog() {
    this.handleMenuClose();
    this.setState({
      switchDialogOpen: true,
      switchUserId: '',
    });
  }

  handleCloseSwitchDialog() {
    this.setState({
      switchDialogOpen: false,
      switchUserId: '',
    });
  }

  handleSwitchUserChange(event) {
    this.setState({
      switchUserId: event.target.value,
    });
  }

  handleSwitchUserConfirm() {
    this.handleSwitchUser(this.state.switchUserId);
  }
}

const mapStateToProps = (state: any) => {
  return {
    users: state.users || {},
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
  }
};

export const HeaderContainer = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(HeaderContainer_));
