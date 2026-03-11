import * as React from 'react';
import Box from '@mui/material/Box';
import { connect } from 'react-redux';
import Modal from '@mui/material/Modal';

export class BasicModalWrapper_ extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      isModalOpen: this.props.isOpen || false,
    };

    this.openModal = this.props.openModal || this.openModal.bind(this);
    this.closeModal = this.props.closeModal || this.closeModal.bind(this);
  }

  render() {
    return (
      <div>
        {this.props.renderTrigger ? this.props.renderTrigger(this) : null}

        <Modal
          aria-labelledby='simple-modal-title'
          aria-describedby='simple-modal-description'
          open={this.state.isModalOpen}
          onClose={this.closeModal}
        >
          <Box
            sx={{
              position: 'absolute',
              minWidth: 120,
              backgroundColor: 'common.white',
              boxShadow: 3,
              p: 1,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {this.props.renderBody(this)}
          </Box>
        </Modal>
      </div>
    );
  }

  openModal() {
    this.setState({
      isModalOpen: true,
    });
    if(this.props.opOpen) {
      this.props.opOpen();
    }
  }

  closeModal() {
    this.setState({
      isModalOpen: false,
    });
    if(this.props.onClose) {
      this.props.onClose();
    }
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

const mapStateToProps = (state: any) => {
  return {
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
  }
};

export const BasicModalWrapper = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BasicModalWrapper_);
