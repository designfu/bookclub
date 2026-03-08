import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Book } from 'types';
import { VoteCardBase } from 'components/display/VoteCardBase';
import { VotePitchTooltip } from 'components/display/VotePitchTooltip';
import { VotingSelect } from 'components/display/VotingSelect';

export interface VoteCardProps {
  book: Book;
  i: number;
  points: number;
  onVote?: Function;
  isNewlySuggested?: boolean;
  disablePitchTooltip?: boolean;
}

export class VoteCard extends React.Component<VoteCardProps, any> {
  render() {
    const { book, points } = this.props;

    const card = (
      <VoteCardBase
        title={book.title}
        author={book.author}
        image={book && book.links && book.links.image}
        newlySuggested={!!this.props.isNewlySuggested}
        trailingContent={
          <VotingSelect
            size='small'
            name='points'
            value={points}
            onChange={this.onDropdownChange}
            sx={{
              '&:before, &:after': {
                display: 'none',
              },
            }}
          >
            <MenuItem value={3}>3 pts</MenuItem>
            <MenuItem value={2}>2 pts</MenuItem>
            <MenuItem value={1}>1 pt</MenuItem>
            <MenuItem value={0}>0 pts</MenuItem>
          </VotingSelect>
        }
      />
    );

    return (
      <VotePitchTooltip title={book.pitch || 'No pitch provided.'} disabled={!!this.props.disablePitchTooltip}>
        {card}
      </VotePitchTooltip>
    );
  }

  onDropdownChange = (e) => {
    const points = parseInt(e.target.value, 10);
    if(this.props.onVote) {
      this.props.onVote(this.props.book, points);
    }
  };
}
