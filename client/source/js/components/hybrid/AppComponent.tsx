import * as React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from 'components/pages/HomePage';
import { BooksPage } from 'components/pages/BooksPage';
import { SeasonsPage } from 'components/pages/SeasonsPage';
import { CurrentPage } from 'components/pages/CurrentPage';
import { UsersPage } from 'components/pages/UsersPage';
import { AppContainer } from 'components/containers/AppContainer';
import { UserActions } from 'actions/UserActions';
import { BookActions } from 'actions/BookActions';

class AppComponent_ extends React.Component<any, any> {
  render() {
    return (
      <div>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<AppContainer />}>
              <Route index element={<CurrentPage />} />
              <Route path='voting' element={<CurrentPage />} />
              <Route path='home' element={<HomePage />} />
              <Route path='books' element={<BooksPage />} />
              <Route path='seasons' element={<SeasonsPage />} />
              <Route path='users' element={<UsersPage />} />
              <Route path='current' element={<CurrentPage />} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

  componentDidMount() {
    this.props.componentDidMount();
  }
}

const mapStateToProps = (state: any) => {
  return state;
};

const mapDispatchToProps = (dispatch: any, ownProps: any) => {
  return {
    componentDidMount() {
      dispatch(UserActions.fetchSelf());
      dispatch(UserActions.fetchAllUsers());
      dispatch(BookActions.fetchBookList());
    },
  }
};

export const AppComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppComponent_);
