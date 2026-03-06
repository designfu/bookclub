import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DialogContentText from '@mui/material/DialogContentText';
import { Book } from 'types';
import { ConfirmDialogButton } from 'components/display/ConfirmDialogButton';

export interface OpenSeasonDialogButtonProps {
  onRef?: Function;
  onConfirm: Function;
  books: { [key:string]: Book };
}

export class OpenSeasonDialogButton extends React.Component<OpenSeasonDialogButtonProps, any> {
  dialog: ConfirmDialogButton;

  state = {
    book: '',
  };

  render() {
    const books: any[] = Object.values(this.props.books);
    const openSeasonBookLabelId = 'open-season-book-label';

    return (
      <ConfirmDialogButton
        title='Close this season?'
        content={
          <div>
            <DialogContentText>Pick which book to open the season with</DialogContentText>
            <FormControl className='o-field o-field--dropdown'>
              <InputLabel id={openSeasonBookLabelId}>Book</InputLabel>
              <Select
                id='new-season-book'
                labelId={openSeasonBookLabelId}
                label='Book'
                name='book'
                value={this.state.book}
                onChange={this.handleChange.bind(this)}
              >
                <MenuItem value=''>
                  <em>None</em>
                </MenuItem>
                {books.map((book) => <MenuItem key={book._id} value={book._id}>{book.title} - {book.author}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
        }
        confirmText='Open New Season'
        onRef={(ref) => (this.dialog = ref)}
        onConfirm={this.handleConfirm.bind(this)}
        onCancel={this.closeDialog.bind(this)}
      >
        Open New Season
      </ConfirmDialogButton>
    );
  }

  closeDialog() {
    this.setState({
      book: '',
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
}
