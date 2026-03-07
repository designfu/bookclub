import * as React from 'react';
import { connect } from 'react-redux';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import ListSubheader from '@mui/material/ListSubheader';
import { Link, useLocation } from 'react-router-dom';
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
    this.formatUserLabel = this.formatUserLabel.bind(this);
  }

  render() {
    const { anchorEl, switchDialogOpen, switchUserId } = this.state;
    const { users } = this.props;
    const switchUserLabelId = 'switch-user-id-label';
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
      <AppBar position='sticky' color='default' elevation={1} component={Paper} className='c-header'>
        <Toolbar disableGutters className='c-header__toolbar'>
          <HeaderNavTabs isAdmin={users.isAdmin} />
          <Box className='c-header__right'>
            {me
              ? (
                <>
                  {!this.props.isSmallScreen ? <Box className='c-header__user-name' onClick={this.handleMenuOpen}>{me.name}</Box> : null}
                  <IconButton
                    className='c-header__user-button'
                    size='small'
                    onClick={this.handleMenuOpen}
                    aria-label='User menu'
                  >
                    <Avatar
                      src={me.avatar || undefined}
                      alt={me.name || 'User'}
                      sx={{ width: 28, height: 28, fontSize: 13, fontWeight: 600 }}
                    >
                      {this.fallbackInitialForUser(me)}
                    </Avatar>
                  </IconButton>
                </>
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
                <FormControl fullWidth margin='normal'>
                  <InputLabel id={switchUserLabelId}>User</InputLabel>
                  <Select
                    id='switch-user-id'
                    labelId={switchUserLabelId}
                    label='User'
                    name='switchUserId'
                    value={switchUserId}
                    onChange={this.handleSwitchUserChange}
                  >
                    {adminUsers.length > 0 ? <ListSubheader>Admins</ListSubheader> : null}
                    {adminUsers.map((user: User) => (
                      <MenuItem key={user._id} value={user._id}>{this.formatUserLabel(user)}</MenuItem>
                    ))}
                    {memberUsers.length > 0 ? <ListSubheader>Members</ListSubheader> : null}
                    {memberUsers.map((user: User) => (
                      <MenuItem key={user._id} value={user._id}>{this.formatUserLabel(user)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button color='primary' onClick={this.handleCloseSwitchDialog}>Cancel</Button>
                <Button color='secondary' onClick={this.handleSwitchUserConfirm} disabled={!switchUserId}>Switch</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Toolbar>
      </AppBar>
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
    const currentUserId = this.props.users && this.props.users.myId ? this.props.users.myId : '';
    this.handleMenuClose();
    this.setState({
      switchDialogOpen: true,
      switchUserId: currentUserId,
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

  formatUserLabel(user: User): string {
    const name = user && user.name ? user.name : 'Unnamed User';
    return `${name} (${user._id})`;
  }

  fallbackInitialForUser(user: User): string {
    const name = user && user.name ? user.name.trim() : '';
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}

const HeaderContainerResponsive = (props) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <HeaderContainer_
      {...props}
      isSmallScreen={isSmallScreen}
    />
  );
};

const HeaderNavTabs = ({ isAdmin }) => {
  const location = useLocation();
  const pathname = location.pathname || '/';
  const selectedPath = pathname.startsWith('/books')
    ? '/books'
    : pathname.startsWith('/seasons')
      ? '/seasons'
      : pathname.startsWith('/users')
        ? '/users'
        : '/';

  return (
    <Box className='c-header__nav-tabs'>
      <MenuItem className='c-header__nav-item' component={Link} to='/' selected={selectedPath === '/'}>Voting</MenuItem>
      <MenuItem className='c-header__nav-item' component={Link} to='/books' selected={selectedPath === '/books'}>Books</MenuItem>
      <MenuItem className='c-header__nav-item' component={Link} to='/seasons' selected={selectedPath === '/seasons'}>Previous Seasons</MenuItem>
      <Box className='c-header__nav-spacer' />
      {isAdmin ? <MenuItem className='c-header__nav-item' component={Link} to='/users' selected={selectedPath === '/users'}>Users</MenuItem> : null}
    </Box>
  );
};

const mapStateToProps = (state: any) => {
  return {
    users: state.users || {},
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
  }
};

export const HeaderContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(HeaderContainerResponsive);
