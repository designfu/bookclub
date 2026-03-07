import * as React from 'react';
import { connect } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { BookList } from 'components/display/BookList';
import { EditBookDialog } from 'components/display/EditBookDialog';
import { BookActions, BookActionTypes } from 'actions/BookActions';
import { ReduxActions } from 'actions/ReduxActions';

class EditableBookListContainer_ extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      isModalOpen: this.props.isOpen || false,
      book: null,
      deleteError: '',
    };

    this.openModal = this.props.openModal || this.openModal.bind(this);
    this.closeModal = this.props.closeModal || this.closeModal.bind(this);
  }

  render() {
    const { isAdmin, myId } = this.props;

    return (
      <div className='c-editable-book-list-container'>
        <BookList
          isAdmin={isAdmin}
          myId={myId}
          books={this.props.books}
          separateStatuses={this.props.separateStatuses}
          collapseFinished={this.props.collapseFinished}
          newSince={this.props.newSince}
          yourBookPlaceholders={this.props.yourBookPlaceholders}
          showAdminActions={this.props.showAdminActions}
          onItemEdit={this.onEditClick.bind(this)}
          onItemDelete={this.onDeleteClick.bind(this)}
          onItemPropose={this.onProposeClick.bind(this)}
          onItemRetract={this.onRetractClick.bind(this)}
        />

        <EditBookDialog
          handleClose={this.closeModal.bind(this)}
          onSubmit={this.onEditSubmit.bind(this)}
          open={this.state.isModalOpen}
          book={this.state.book}
        />

        <Snackbar
          open={!!this.state.deleteError}
          autoHideDuration={5000}
          onClose={this.handleDeleteErrorClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <SnackbarContent
            message={this.state.deleteError}
            style={{ backgroundColor: '#d32f2f' }}
          />
        </Snackbar>
      </div>
    );
  }

  onEditSubmit(formState) {
    this.props.submit.call(this, this.state.book, formState);
  }

  onEditClick(book) {
    this.openModal(book);
  }

  onDeleteClick(book) {
    this.setState({ deleteError: '' });
    this.props.deleteBook(book)
      .catch((err) => {
        const message = err && err.message
          ? err.message
          : 'Could not delete this book. Only backlog or suggested books can be deleted.';
        this.setState({ deleteError: message });
      });
  }

  handleDeleteErrorClose = () => {
    this.setState({ deleteError: '' });
  };

  onProposeClick(book) {
    this.props.proposeBook(book);
  }

  onRetractClick(book) {
    this.props.retractBook(book);
  }

  openModal(book) {
    this.setState({
      isModalOpen: true,
      book,
    });
  }

  closeModal() {
    this.setState({
      isModalOpen: false,
      book: null,
    });
  }
}

const mapStateToProps = (state: any) => {
  return {
    myId: state.users.myId,
    isAdmin: state.users.isAdmin,
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    submit(book, formState) {
      const bookPostData = {
        ...book,
        title: formState.title,
        author: formState.author,
        pitch: formState.pitch,
        genre: formState.genre,
      };
      bookPostData.links.goodreads = formState.goodreads;
      bookPostData.links.image = formState.image;
      dispatch(ReduxActions.onNext(BookActionTypes.GOT_UPDATE, () => {
        this.closeModal();
      }));
      dispatch(BookActions.updateBook(bookPostData));
    },
    deleteBook(book) {
      return dispatch(BookActions.deleteBook(book));
    },
    proposeBook(book) {
      const bookPostData = {
        _id: book._id,
        'dates.proposed': Date.now(),
      };
      dispatch(BookActions.updateBook(bookPostData));
    },
    retractBook(book) {
      const bookPostData = {
        _id: book._id,
        $unset: {
          'dates.proposed': 1,
        },
      };
      dispatch(BookActions.updateBook(bookPostData));
    },
  }
};

export const EditableBookListContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(EditableBookListContainer_);
