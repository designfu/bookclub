import * as React from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { ConfirmDialog } from 'components/display/ConfirmDialog';
import { RateBookDialogContent } from 'components/display/RateBookDialogContent';

function toId(value) {
  if (!value) {
    return null;
  }
  const id = value && value._id ? value._id : value;
  return id && id.toString ? id.toString() : id;
}

function hasUserRating(book, myId): boolean {
  if (!book || !myId) {
    return false;
  }
  const ratings = Array.isArray(book.ratings) ? book.ratings : [];
  return ratings.some((rating) => {
    const ratingUserId = toId(rating && rating.user);
    return ratingUserId === myId && typeof rating.value === 'number';
  });
}

export class PreviousBookRatingNotice extends React.Component<any, any> {
  rateBookDialog: ConfirmDialog;

  state = {
    value: '',
    isValid: true,
  };

  render() {
    const book = this.getPreviousFinishedBook();
    const myId = toId(this.props.myId);
    if (!book || !myId || hasUserRating(book, myId)) {
      return null;
    }

    return (
      <React.Fragment>
        <Paper className='c-voting-session__notice-card' elevation={1}>
          <Alert
            className='c-voting-session__notice-alert'
            severity='info'
            action={
              <Button color='inherit' size='small' onClick={this.handleOpenDialog}>
                Rate
              </Button>
            }
          >
            Would you like to rate <span className='c-voting-session__notice-book-title'>{book.title || 'the previously finished book'}</span>?
          </Alert>
        </Paper>
        <ConfirmDialog
          title={`Rate ${book.title || 'Previous Book'}`}
          content={
            <RateBookDialogContent
              id='previous-book-rating'
              value={this.state.value}
              isValid={this.state.isValid}
              onSubmit={this.handleSubmit}
              onValueChange={this.handleValueChange}
            />
          }
          confirmText='Save Rating'
          onRef={(ref) => (this.rateBookDialog = ref)}
          onConfirm={this.handleSubmit}
          onCancel={this.handleCloseDialog}
        />
      </React.Fragment>
    );
  }

  getPreviousFinishedBook() {
    const previousSeason = this.props.previousSeason;
    if (!previousSeason || !previousSeason.book) {
      return null;
    }
    const bookId = toId(previousSeason.book);
    return this.props.books && this.props.books[bookId]
      ? this.props.books[bookId]
      : previousSeason.book;
  }

  handleOpenDialog = (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    if (this.rateBookDialog) {
      this.rateBookDialog.openDialog();
    }
    this.setState({
      value: '',
      isValid: true,
    });
  };

  handleCloseDialog = () => {
    this.setState({
      value: '',
      isValid: true,
    });
  };

  handleValueChange = (parsed) => {
    this.setState({
      value: Number.isNaN(parsed) ? '' : parsed,
      isValid: !Number.isNaN(parsed) && parsed >= 1 && parsed <= 5,
    });
  };

  handleSubmit = async (event?) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    const book = this.getPreviousFinishedBook();
    const value = parseFloat(this.state.value);
    if (!book || Number.isNaN(value) || value < 1 || value > 5) {
      this.setState({ isValid: false });
      return;
    }

    try {
      await this.props.onRateBook({ book, value });
      if (this.rateBookDialog) {
        this.rateBookDialog.closeDialog();
      }
      this.handleCloseDialog();
    } catch (err) {
      this.setState({ isValid: false });
    }
  };
}
