import * as React from 'react';
import { connect } from 'react-redux';
import { AppstateActions } from 'actions/AppstateActions';

class HomePage_ extends React.Component<any, any> {
  render() {
    return (
      <div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
    isLoggedIn: state.users.isLoggedIn,
    isAdmin: state.users.isAdmin,
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
  }
};

export const HomePage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(HomePage_);