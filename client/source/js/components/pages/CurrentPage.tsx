import * as React from 'react';
import { connect } from 'react-redux';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import DialogContentText from '@mui/material/DialogContentText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { VotingSessionStatus } from 'types';
import { SeasonActions } from 'actions/SeasonActions';
import { VotingSessionActions } from 'actions/VotingSessionActions';
import { BookActions } from 'actions/BookActions';
import { ConfirmDialogButton } from 'components/display/ConfirmDialogButton';
import { VotingSessionContainer } from 'components/hybrid/VotingSessionComponent';
import { PreviousBookRatingNotice } from 'components/hybrid/PreviousBookRatingNotice';
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
      isSmallScreen,
    } = this.props;

    const isVotingOpen = votingSession.status === VotingSessionStatus.OPEN;
    const votingSystemLabelId = 'new-season-voting-system-label';
    const ratingNotice = (
      <PreviousBookRatingNotice
        previousSeason={this.props.previousSeason}
        books={this.props.books}
        myId={this.props.myId}
        onRateBook={({ book, value }) => this.props.rateBook({ book, value, user: this.props.myId })}
      />
    );

    const SeasonInfo = {
      ['ACCEPTANCE_WITH_RANKED_TIEBREAKER']: SeasonInfoAcceptance,
      ['ADVANCED_ACCEPTANCE']: SeasonInfoAdvancedAcceptance,
      ['WEIGHTED_3X']: SeasonInfoWeighted,
    }[votingSession.system] || SeasonInfoWeighted;

    return (
      <Container className='l-current-page' maxWidth={false} disableGutters>
        {isLoggedIn && isAdmin ?
          <Box>
            {!currentSeason ?
              <ConfirmDialogButton
                title='Open new season?'
                content={
                  <div>
                    <DialogContentText>This will start a brand new season, and start a voting session for a new book.</DialogContentText>
                    <FormControl className='o-field o-field--dropdown'>
                      <InputLabel id={votingSystemLabelId}>Voting System</InputLabel>
                      <Select
                        id='new-season-voting-system'
                        labelId={votingSystemLabelId}
                        label='Voting System'
                        name='votingSystem'
                        value={this.state.votingSystem}
                        onChange={this.handleVotingSystemChange.bind(this)}
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
          </Box>
        : null}
        {currentSeason ?
          <Paper className='c-current-page__season-card'>
            {ratingNotice}
            <SeasonInfo
              books={this.props.books}
              title={currentSeason ? 'Current Season' : 'Previous Season'}
              season={currentSeason}
              votingSession={votingSession}
              onSeasonClose={this.props.closeCurrentSeason.bind(this)}
              allowClosing={isLoggedIn && isAdmin && currentSeason && !isVotingOpen}
              startVotingOpen={true}
              hideBookBadges={true}
              isSmallScreen={isSmallScreen}
            />
          </Paper>
        : null}
        {!currentSeason ? ratingNotice : null}
        {isLoggedIn && currentSeason && isVotingOpen ?
          <VotingSessionContainer />
        : null}
      </Container>
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
    myId: state.users.myId,
    currentSeason: state.seasons.seasons[state.seasons.currentId],
    previousSeason: state.seasons.previousId ? state.seasons.seasons[state.seasons.previousId] : null,
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

    rateBook({ book, value, user }) {
      return dispatch(BookActions.rateBook(book, {
        value,
        user,
      }));
    },
  }
};

const CurrentPageConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CurrentPage_);

export const CurrentPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return <CurrentPageConnected isSmallScreen={isSmallScreen} />;
};
