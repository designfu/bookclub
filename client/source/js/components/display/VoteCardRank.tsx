import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import { Book } from 'types';
import { rankString } from '@client/utils/strings';
import { VoteCardBase } from 'components/display/VoteCardBase';
import { VotePitchTooltip } from 'components/display/VotePitchTooltip';
import { VotingSelect } from 'components/display/VotingSelect';

export interface VoteCardRankProps {
  book: Book;
  i: number;
  rank: number;
  maxRank: number;
  onVote?: Function;
  isNewlySuggested?: boolean;
}

export class VoteCardRank extends React.Component<VoteCardRankProps, any> {
  render() {
    const { book, rank, maxRank } = this.props;

    const card = (
      <VoteCardBase
        bookTitle={book.title}
        bookAuthor={book.author}
        image={book && book.links && book.links.image}
        newlySuggested={!!this.props.isNewlySuggested}
        trailingContent={
          <VotingSelect
            size='small'
            name='points'
            value={rank}
            onChange={this.onDropdownChange}
            sx={{
              '&:before, &:after': {
                display: 'none',
              },
            }}
          >
            {Array.from({ length: maxRank }, (_, i) =>
              <MenuItem key={i} value={i}>{rankString(i)}</MenuItem>
            )}
            <MenuItem key={-1} value={-1}>{rankString(-1)}</MenuItem>
          </VotingSelect>
        }
      />
    );

    return (
      <VotePitchTooltip title={book.pitch || 'No pitch provided.'}>
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
