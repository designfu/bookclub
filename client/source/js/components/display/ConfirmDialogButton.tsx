import * as React from 'react';
import Button from '@mui/material/Button';
import { ButtonProps } from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export interface ConfirmDialogButtonProps {
  children?: React.ReactNode;
  onOpen?: Function;
  onCancel?: Function;
  onConfirm?: Function;
  color?: ButtonProps['color'];
  title: string;
  content: any;
  confirmText?: string;
  confirmColor?: ButtonProps['color'];
  cancelText?: string;
  cancelColor?: ButtonProps['color'];
  onRef?: Function;
  closeOnConfirm?: boolean;
  closeOnCancel?: boolean;
  isConfirmDisabled?: boolean;
}

export class ConfirmDialogButton extends React.Component<ConfirmDialogButtonProps, any> {
  static defaultProps = {
    closeOnCancel: true,
    closeOnConfirm: true,
  };

  state = {
    open: false,
  };

  openDialog = () => {
    this.setState({ open: true });
    if (this.props.onOpen) {
      this.props.onOpen();
    }
  };

  closeDialog = () => {
    this.setState({ open: false });
  };

  handleCancel = () => {
    if (this.props.closeOnCancel) {
      this.closeDialog();
    }
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  };

  handleConfirm = () => {
    if (this.props.closeOnConfirm) {
      this.closeDialog();
    }
    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
  };

  render() {
    const {
      confirmText,
      cancelText,
      content,
      title,
      isConfirmDisabled,
    } = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isConfirmDisabled: false,
      ...this.props
    };

    const confirmColor: ButtonProps['color'] = this.props.confirmColor || 'primary';
    const cancelColor: ButtonProps['color'] = this.props.cancelColor || 'primary';
    const color: ButtonProps['color'] = this.props.color || 'primary';

    return (
      <div>
        <Button onClick={this.openDialog} color={color}>{this.props.children}</Button>
        <Dialog
          open={this.state.open}
          onClose={this.closeDialog}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{title}</DialogTitle>
          <DialogContent>
            {content}
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCancel} color={cancelColor}>
              {cancelText}
            </Button>
            <Button onClick={this.handleConfirm} color={confirmColor} autoFocus disabled={isConfirmDisabled}>
              {confirmText}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
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
