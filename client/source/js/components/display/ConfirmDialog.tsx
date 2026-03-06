import * as React from 'react';
import Button from '@mui/material/Button';
import { ButtonProps } from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { SemanticButtonColor, toMuiButtonColor } from 'components/display/button-colors';

export interface ConfirmDialogProps {
  onOpen?: Function;
  onCancel?: Function;
  onConfirm?: Function;
  title: string;
  content: any;
  confirmText?: string;
  confirmColor?: SemanticButtonColor;
  cancelText?: string;
  cancelColor?: SemanticButtonColor;
  onRef?: Function;
  closeOnConfirm?: boolean;
  closeOnCancel?: boolean;
  open?: boolean;
}

export class ConfirmDialog extends React.Component<ConfirmDialogProps, any> {
  static defaultProps = {
    closeOnCancel: true,
    closeOnConfirm: true,
  };

  state = {
    open: false,
  };

  constructor(props) {
    super(props);

    if(props.hasOwnProperty('open')) {
      this.state = {
        open: props.open,
      };
    }
  }

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
    } = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      ...this.props
    };

    const confirmColor: ButtonProps['color'] = toMuiButtonColor(this.props.confirmColor);
    const cancelColor: ButtonProps['color'] = toMuiButtonColor(this.props.cancelColor);

    return (
      <div>
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
            <Button onClick={this.handleConfirm} color={confirmColor} autoFocus>
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

  componentDidUpdate(prevProps) {
    if (
      this.props.hasOwnProperty('open')
      && prevProps.open !== this.props.open
      && this.state.open !== this.props.open
    ) {
      this.setState({
        open: this.props.open,
      });
    }
  }
}
