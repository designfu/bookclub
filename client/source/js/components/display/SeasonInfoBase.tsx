import * as React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { ConfirmDialog } from 'components/display/ConfirmDialog';
import { toJSON } from 'utils/objects';
import TextField from '@mui/material/TextField';
import { RateBookDialogContent } from 'components/display/RateBookDialogContent';
import { renderSeasonInfoDate } from 'components/display/season-info-common';
import { toMuiButtonColor } from 'components/display/button-colors';

function getUserRating(book, myId?): number {
  if(!myId) return -1;
  const rating = book ? book.ratings.find(rating => rating.user === myId) : null;
  return rating ? rating.value : -1;
}

export interface SeasonInfoBaseProps {
  season: any;
  votingSession: any;
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
  isSmallScreen?: boolean;
}

export interface SeasonInfoBaseState {
  closeSeasonDialogOpen: boolean;
  deleteSeasonDialogOpen: boolean;
  renameSeasonDialogOpen: boolean;
  rateBookDialogOpen: boolean;
  showJson: boolean;
  showVotingResults: boolean;
  seasonTitle: string;
  userBookRating: number;
  isRatingValid: boolean;
}

export class SeasonInfoBase extends React.Component<SeasonInfoBaseProps, SeasonInfoBaseState> {
  closeSeasonDialog: ConfirmDialog;
  renameSeasonDialog: ConfirmDialog;
  rateBookDialog: ConfirmDialog;

  constructor(props) {
    super(props);

    this.state = {
      closeSeasonDialogOpen: false,
      deleteSeasonDialogOpen: false,
      renameSeasonDialogOpen: false,
      rateBookDialogOpen: false,
      showJson: false,
      seasonTitle: props.season ? props.season.title || '' : '',
      showVotingResults: props.startVotingOpen,
      userBookRating: getUserRating(props.season ? props.season.book : null, props.myId),
      isRatingValid: true,
    };
  }

  handleDialogClose = () => {
    this.setState({
      closeSeasonDialogOpen: false,
      deleteSeasonDialogOpen: false,
      renameSeasonDialogOpen: false,
      rateBookDialogOpen: false,
      seasonTitle: this.props.season ? this.props.season.title || '' : '',
    });
  };

  handleCloseSeasonClick = () => {
    this.setState({
      closeSeasonDialogOpen: true,
    });
  };

  handleRenameSeasonClick = () => {
    this.setState({
      renameSeasonDialogOpen: true,
    });
  };

  handleRateBookClick = () => {
    this.setState({
      userBookRating: getUserRating(this.props.season ? this.props.season.book : null, this.props.myId),
      isRatingValid: true,
      rateBookDialogOpen: true,
    });
  };

  handleToggleVotingResultsClick = () => {
    this.setState({
      showVotingResults: !this.state.showVotingResults,
    });
  };

  handleCloseSeasonConfirm = () => {
    this.handleDialogClose();
    this.props.onSeasonClose();
  };

  handleDeleteSeasonClick = () => {
    this.setState({
      deleteSeasonDialogOpen: true,
    });
  };

  handleDeleteSeasonConfirm = () => {
    this.handleDialogClose();
    if (this.props.onSeasonDelete) {
      this.props.onSeasonDelete();
    }
  };

  handleRateBookConfirm = (e?) => {
    if(e) {
      e.preventDefault();
    }
    if(this.state.isRatingValid) {
      const { userBookRating } = this.state;
      this.handleDialogClose();
      this.props.onRateBook({
        book: this.props.season.book,
        value: userBookRating,
      });
    }
  };

  handleRenameSeasonConfirm = (e?) => {
    if(e) {
      e.preventDefault();
    }
    this.props.onSeasonRename(this.state.seasonTitle);
    this.handleDialogClose();
  };

  showJson = () => {
    this.setState({
      showJson: true,
    });
  };

  hideJson = () => {
    this.setState({
      showJson: false,
    });
  };

  votingResultsWrapClassName() {
    return this.props.isSmallScreen
      ? 'c-season-info__voting-results-wrap c-season-info__voting-results-wrap--scroll'
      : 'c-season-info__voting-results-wrap';
  }

  componentDidUpdate(prevProps) {
    const prevTitle = prevProps.season ? prevProps.season.title || '' : '';
    const title = this.props.season ? this.props.season.title || '' : '';
    if (prevTitle !== title) {
      this.setState({
        seasonTitle: title,
      });
    }
  }

  renderSeasonDialogs() {
    return (
      <React.Fragment>
        <ConfirmDialog
          open={this.state.closeSeasonDialogOpen}
          title='Close this season?'
          content={
            <DialogContentText>Are you sure you want to close the current season? This action cannot be undone.</DialogContentText>
          }
          confirmText='Close Season'
          confirmColor='secondary'
          onRef={(ref) => (this.closeSeasonDialog = ref)}
          onConfirm={this.handleCloseSeasonConfirm}
          onCancel={this.handleDialogClose}
        />

        <ConfirmDialog
          open={this.state.renameSeasonDialogOpen}
          title='Rename Season'
          content={
            <form onSubmit={this.handleRenameSeasonConfirm}>
              <TextField
                id='season-title-rename'
                label='Season Title'
                className='o-field o-field--text'
                value={this.state.seasonTitle}
                onChange={(e) => this.setState({ seasonTitle: e.target.value })}
                margin='normal'
                type='text'
              />
            </form>
          }
          confirmText='Rename Season'
          onRef={(ref) => (this.renameSeasonDialog = ref)}
          onConfirm={this.handleRenameSeasonConfirm}
          onCancel={this.handleDialogClose}
        />

        {this.props.onSeasonDelete ? (
          <ConfirmDialog
            open={this.state.deleteSeasonDialogOpen}
            title='Delete this season and its votes?'
            content={
              <DialogContentText>Are you sure you want to delete this season and all votes in its voting session? This action cannot be undone.</DialogContentText>
            }
            confirmText='Delete Season'
            confirmColor='danger'
            onConfirm={this.handleDeleteSeasonConfirm}
            onCancel={this.handleDialogClose}
          />
        ) : null}

        <ConfirmDialog
          open={this.state.rateBookDialogOpen}
          title='Rate Book'
          content={
            <RateBookDialogContent
              id='season-rate-book'
              value={this.state.userBookRating > -1 ? this.state.userBookRating : ''}
              isValid={this.state.isRatingValid}
              onSubmit={this.handleRateBookConfirm}
              onValueChange={(value) => this.setState({
                userBookRating: value,
                isRatingValid: value >= 1 && value <= 5,
              })}
            />
          }
          confirmText='Rate Book'
          onRef={(ref) => (this.rateBookDialog = ref)}
          onConfirm={this.handleRateBookConfirm}
          onCancel={this.handleDialogClose}
        />
      </React.Fragment>
    );
  }

  renderSeasonActions({
    allowToggleVotingResults,
    showVotingResults,
    allowRating,
    allowRenaming,
    allowClosing,
    allowDeleting,
  }: {
    allowToggleVotingResults: boolean;
    showVotingResults: boolean;
    allowRating: boolean;
    allowRenaming: boolean;
    allowClosing: boolean;
    allowDeleting: boolean;
  }) {
    const showActions = allowToggleVotingResults || allowRating || allowRenaming || allowClosing || allowDeleting;
    if (!showActions) {
      return null;
    }

    return (
      <CardActions>
        {allowToggleVotingResults ? <Button size='small' onClick={this.handleToggleVotingResultsClick}>{showVotingResults ? 'Hide Voting Results' : 'Show Voting Results'}</Button> : null}
        {allowRating ? <Button size='small' onClick={this.handleRateBookClick}>Rate Book</Button> : null}
        <Box sx={{ flexGrow: 1 }} />
        {allowRenaming ? <Button size='small' onClick={this.handleRenameSeasonClick}>Rename Season</Button> : null}
        {allowClosing ? <Button size='small' color='secondary' onClick={this.handleCloseSeasonClick}>Close Season</Button> : null}
        {allowDeleting ? <Button size='small' color={toMuiButtonColor('danger')} onClick={this.handleDeleteSeasonClick}>Delete Season</Button> : null}
      </CardActions>
    );
  }

  renderSeasonHeader({
    title,
    systemBadgeLabel,
    systemBadgeTooltip,
  }: {
    title: string;
    systemBadgeLabel?: string;
    systemBadgeTooltip?: string;
  }) {
    return (
      <div className='c-season-info__header o-action-title'>
        <Typography
          component='div'
          className={`c-season-info__title-row${this.props.isSmallScreen ? ' c-season-info__title-row--stacked' : ''}`}
        >
          <Typography variant='h5' component='h3' className='c-season-info__title'>
            {title}
          </Typography>
          {systemBadgeLabel && systemBadgeTooltip ? (
            <Tooltip title={systemBadgeTooltip}>
              <Typography
                component='span'
                className={`c-season-info__system${this.props.isSmallScreen ? ' c-season-info__system--stacked' : ''}`}
              >
                {systemBadgeLabel}
              </Typography>
            </Tooltip>
          ) : null}
        </Typography>
      </div>
    );
  }

  renderSeasonDetails(season) {
    return (
      <Typography component='div' className='c-season-info__details'>
        {season.dates.created ?
          renderSeasonInfoDate('Started', season.dates.created)
          : null}
        {season.dates.started ?
          renderSeasonInfoDate('Book Chosen', season.dates.started)
          : null}
        {season.dates.finished ?
          renderSeasonInfoDate('Finished', season.dates.finished)
          : null}
      </Typography>
    );
  }

  renderSeasonJson(showJson, season) {
    if(!showJson) {
      return null;
    }

    return (
      <div className='c-season-info__admin-info'>
        <div className='o-json-dump'>
          <Typography component='span'>Season JSON</Typography>
          <pre>{toJSON(season)}</pre>
        </div>
      </div>
    );
  }
}
