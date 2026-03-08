import * as React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { User } from 'types';

export interface UserListProps {
  label: string;
  voters: User[];
  className?: string;
}

export class UserList extends React.Component<UserListProps, any> {
  render() {
    const { label, voters } = this.props;

    return (
      <Paper
        className={this.props.className}
        sx={{ p: 1.25, mb: 1.25 }}
      >
        <Typography variant='subtitle1' component='h4'>
          {label}
        </Typography>
        <Typography component='p'>
          {voters.map(_ => _.name).join(', ')}
        </Typography>
      </Paper>
    );
  }
}
