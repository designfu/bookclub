import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DialogContentText from '@mui/material/DialogContentText';
import Box from '@mui/material/Box';
import { Book } from 'types';
import { ConfirmDialogButton } from 'components/display/ConfirmDialogButton';
import { CloseVotingResultsList } from 'components/display/CloseVotingResultsList';
import { pointString } from 'utils/strings';
import { dialogDropdownFormControlSx } from 'components/form-control-sx';

function bookText(book) {
  return book ? `${book.title} - ${book.author}` : '?? - ??';
}

function toBookId(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'object') {
    return value._id || '';
  }
  return value;
}

function withPoints(results = []) {
  return results.filter(result => (result && result.points ? result.points > 0 : false));
}

function setBookProp(props) {
  const result = withPoints(props.results || [])[0];
  return toBookId(result ? result.book : '') || '';
}

export interface CloseWeightedVotingDialogButtonProps {
  onRef?: Function;
  onConfirm: Function;
  books: { [key:string]: Book };
  votes: any[];
  results: any[];
}

export class CloseWeightedVotingDialogButton extends React.Component<CloseWeightedVotingDialogButtonProps, any> {
  dialog: ConfirmDialogButton;

  state = {
    book: '',
  };

  render() {
    const { results, books } = this.props;
    const { book } = this.state;
    const closeWeightedBookLabelId = 'close-weighted-voting-book-label';
    const resultsWithPoints = withPoints(results || []);
    const booksWithPoints = new Set(resultsWithPoints.map(result => `${toBookId(result.book)}`));
    const bookList: any[] = Object.values(books).filter(book => booksWithPoints.has(`${book._id}`));

    return (
      <ConfirmDialogButton
        title='Close Voting?'
        content={
          <Box>
            <DialogContentText>Pick which book to open the season with</DialogContentText>
            <FormControl sx={dialogDropdownFormControlSx}>
              <InputLabel id={closeWeightedBookLabelId}>Book</InputLabel>
              <Select
                id='new-season-book'
                labelId={closeWeightedBookLabelId}
                label='Book'
                name='book'
                value={book}
                onChange={this.handleChange.bind(this)}
              >
                {bookList.map((book) => <MenuItem
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
            <CloseVotingResultsList
              items={resultsWithPoints.map((result, i) => ({
                key: i,
                secondary: pointString(result.points),
                secondaryFirst: true,
                primary: bookText(result.book),
              }))}
            />
          </Box>
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
