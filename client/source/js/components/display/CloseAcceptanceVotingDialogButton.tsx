import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DialogContentText from '@mui/material/DialogContentText';
import { Book, BookStatus } from 'types';
import { ConfirmDialogButton } from 'components/display/ConfirmDialogButton';
import { acceptanceVoteResultsString } from 'utils/strings';

function bookText(book) {
  return book ? `${book.title} - ${book.author}` : '?? - ??';
}

function setBookProp(props) {
  return (props.results && props.results[0] && props.results[0].book && props.results[0].book._id) || '';
}

export interface CloseAcceptanceVotingDialogButtonProps {
  onRef?: Function;
  onConfirm: Function;
  books: { [key:string]: Book };
  votes: any[];
  results: any[];
}

export class CloseAcceptanceVotingDialogButton extends React.Component<CloseAcceptanceVotingDialogButtonProps, any> {
  dialog: ConfirmDialogButton;

  state = {
    book: '',
  };

  render() {
    const { results, books } = this.props;
    const { book } = this.state;
    const closeAcceptanceBookLabelId = 'close-acceptance-book-label';
    const bookList: any[] = Object.values(books);

    return (
      <ConfirmDialogButton
        title='Close Voting?'
        content={
          <div className='c-close-voting-dialog c-close-voting-dialog--acceptance'>
            <DialogContentText>Pick which book to open the season with</DialogContentText>
            <FormControl className='o-field o-field--dropdown u-space--bot-large'>
              <InputLabel id={closeAcceptanceBookLabelId}>Book</InputLabel>
              <Select
                id='new-season-book'
                labelId={closeAcceptanceBookLabelId}
                label='Book'
                name='book'
                value={book}
                onChange={this.handleChange.bind(this)}
              >
                {bookList.filter(book => book.status === BookStatus.SUGGESTED).map((book) => <MenuItem
                  key={book._id}
                  value={book._id}
                >
                  {bookText(book)}
                </MenuItem>)}
              </Select>
            </FormControl>
            <DialogContentText>
              What the people want:
            </DialogContentText>
            <ul className='c-close-voting-dialog__result-list'>
              {results.map((result, i) => <li key={i} className='c-close-voting-dialog__result'>
                <span className='c-close-voting-dialog__result-book'>{bookText(result.book)}</span>
                <span className='c-close-voting-dialog__result-points'>{acceptanceVoteResultsString(result.rankings)}</span>
              </li>)}
            </ul>
          </div>
        }
        confirmText='Close Voting'
        confirmColor='secondary'
        onRef={(ref) => (this.dialog = ref)}
        onConfirm={this.handleConfirm.bind(this)}
        onCancel={this.closeDialog.bind(this)}
        color='secondary'
        closeOnConfirm={false}
        isConfirmDisabled={!book}
      >
        Close Voting
      </ConfirmDialogButton>
    );
  }

  closeDialog() {
    this.setState({
      book: setBookProp(this.props),
    });
    this.dialog.closeDialog();
  }

  handleConfirm() {
    this.props.onConfirm(this.state.book);
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  componentDidMount() {
    if(this.props.onRef) {
      this.props.onRef(this);
    }
  }

  componentWillUnmount() {
    if(this.props.onRef) {
      this.props.onRef(undefined);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.results !== this.props.results) {
      const book = setBookProp(this.props);
      if (book === this.state.book) {
        return;
      }
      this.setState({
        book,
      });
    }
  }
}
