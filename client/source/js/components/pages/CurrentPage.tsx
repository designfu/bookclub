import * as React from 'react';
import { Router, Route, Switch, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withRouter } from 'react-router';
import DialogContentText from '@material-ui/core/DialogContentText';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { VotingSessionStatus } from 'types';
import { SeasonActions } from 'actions/SeasonActions';
import { VotingSessionActions } from 'actions/VotingSessionActions';
import { ConfirmDialogButton } from 'components/display/ConfirmDialogButton';
import { VotingSessionContainer } from 'components/hybrid/VotingSessionComponent';
import { SeasonInfoAcceptance } from 'components/display/SeasonInfoAcceptance';
import { SeasonInfoWeighted } from 'components/display/SeasonInfoWeighted';
import { SeasonInfoAdvancedAcceptance } from '@client/components/display/SeasonInfoAdvancedAcceptance';

class CurrentPage_ extends React.Component<any, any> {
  openSeasonDialog: ConfirmDialogButton;
  state = {
    votingSystem: 'ADVANCED_ACCEPTANCE',
  };

  render() {
    const {
      votingSession,
      currentSeason,
      isLoggedIn,
      isAdmin,
    } = this.props;

    const isVotingOpen = votingSession.status === VotingSessionStatus.OPEN;

    const SeasonInfo = {
      ['ACCEPTANCE_WITH_RANKED_TIEBREAKER']: SeasonInfoAcceptance,
      ['ADVANCED_ACCEPTANCE']: SeasonInfoAdvancedAcceptance,
      ['WEIGHTED_3X']: SeasonInfoWeighted,
    }[votingSession.system] || SeasonInfoWeighted;

    return (
      <div className='l-current-page'>
        {isLoggedIn && isAdmin ?
          <div>
            {!currentSeason ?
              <ConfirmDialogButton
                title='Open new season?'
                content={
                  <div>
                    <DialogContentText>This will start a brand new season, and start a voting session for a new book.</DialogContentText>
                    <FormControl className='o-field o-field--dropdown'>
                      <InputLabel htmlFor='new-season-voting-system'>Voting System</InputLabel>
                      <Select
                        value={this.state.votingSystem}
                        onChange={this.handleVotingSystemChange.bind(this)}
                        inputProps={{
                          name: 'votingSystem',
                          id: 'new-season-voting-system',
                        }}
                      >
                        <MenuItem value='ADVANCED_ACCEPTANCE'>Advanced Acceptance</MenuItem>
                        <MenuItem value='ACCEPTANCE_WITH_RANKED_TIEBREAKER'>Acceptance With Ranked Tiebreaker</MenuItem>
                        <MenuItem value='WEIGHTED_3X'>Weighted 3x</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                }
                confirmText='Open Season'
                onRef={(ref) => (this.openSeasonDialog = ref)}
                onConfirm={this.openNewSeason.bind(this)}
              >
                Open New Season
              </ConfirmDialogButton>
            : null}
          </div>
        : null}
        {!currentSeason ?
          <div className='c-current-page__empty-state'>
            <Typography variant='body1' component='p'>
              Welcome! Please wait for an admin to start the next season.
            </Typography>
          </div>
        : null}
        {currentSeason ?
          <SeasonInfo
            books={this.props.books}
            title={currentSeason ? 'Current Season' : 'Previous Season'}
            season={currentSeason}
            votingSession={votingSession}
            onSeasonClose={this.props.closeCurrentSeason.bind(this)}
            allowClosing={isLoggedIn && isAdmin && currentSeason && !isVotingOpen}
            startVotingOpen={true}
          />
        : null}
        {isLoggedIn && currentSeason && isVotingOpen ?
          <VotingSessionContainer />
        : null}
      </div>
    );
  }

  componentDidMount() {
    this.props.componentDidMount();
  }

  handleVotingSystemChange(event) {
    this.setState({
      votingSystem: event.target.value,
    });
  }

  openNewSeason() {
    this.props.openNewSeason(this.state.votingSystem);
  }
}

const mapStateToProps = (state: any) => {
  return {
    isLoggedIn: state.users.isLoggedIn,
    isAdmin: state.users.isAdmin,
    currentSeason: state.seasons.seasons[state.seasons.currentId],
    votingSession: state.votingSession.currentId ? state.votingSession.sessions[state.votingSession.currentId]
      : state.votingSession.latestId ? state.votingSession.sessions[state.votingSession.latestId]
        : {},
    books: state.books || {},
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    componentDidMount() {
      dispatch(SeasonActions.fetchCurrent());
    },

    closeCurrentSeason() {
      dispatch(SeasonActions.closeSeason(this.props.currentSeason));
    },

    openNewSeason(votingSystem) {
      dispatch(SeasonActions.openSeason(votingSystem));
    },
  }
};

export const CurrentPage = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps,
)(CurrentPage_));
