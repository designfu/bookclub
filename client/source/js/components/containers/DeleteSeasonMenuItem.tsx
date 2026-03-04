import * as React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import DialogContentText from '@material-ui/core/DialogContentText';
import { ConfirmDialog } from 'components/display/ConfirmDialog';

export interface DeleteSeasonMenuItemProps {
  onDelete: Function;
  onMenuClose?: Function;
}

type DeleteSeasonMenuItemState = {
  dialogOpen: boolean;
}

export class DeleteSeasonMenuItem extends React.Component<DeleteSeasonMenuItemProps, DeleteSeasonMenuItemState> {
  state = {
    dialogOpen: false,
  };

  constructor(props) {
    super(props);
    this.handleOpenDialog = this.handleOpenDialog.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
    this.handleConfirmDelete = this.handleConfirmDelete.bind(this);
  }

  render() {
    return (
      <React.Fragment>
        <MenuItem onClick={this.handleOpenDialog}>Delete Season</MenuItem>
        <ConfirmDialog
          open={this.state.dialogOpen}
          title='Delete this season and its votes?'
          content={
            <DialogContentText>Are you sure you want to delete this season and all votes in its voting session? This action cannot be undone.</DialogContentText>
          }
          confirmText='Delete Season'
          confirmColor='secondary'
          onConfirm={this.handleConfirmDelete}
          onCancel={this.handleCloseDialog}
        />
      </React.Fragment>
    );
  }

  handleOpenDialog() {
    this.setState({ dialogOpen: true });
  }

  handleCloseDialog() {
    this.setState({ dialogOpen: false });
  }

  handleConfirmDelete() {
    this.setState({ dialogOpen: false });
    this.props.onDelete();
  }
}
