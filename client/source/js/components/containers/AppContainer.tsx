import * as React from 'react';
import { connect } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { HeaderContainer } from 'components/containers/HeaderContainer';

class AppContainer_ extends React.Component<any, any> {
  render() {
    return (
      <div>
        <HeaderContainer />
        <main>
          <div><Outlet /></div>
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
  }
};

export const AppContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppContainer_);
