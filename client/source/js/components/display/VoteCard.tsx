import * as React from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Book } from 'types';
import { VotePitchTooltip } from 'components/display/VotePitchTooltip';

export interface VoteCardProps {
  book: Book;
  i: number;
  points: number;
  onVote?: Function;
  isResetAdded?: boolean;
}

export class VoteCard extends React.Component<VoteCardProps, any> {
  render() {
    const { book, points } = this.props;
    const image = (book && book.links && book.links.image) ? book.links.image : '/icons/icon-book-256.png';

    const card = (
      <Card className={`c-vote-card${this.props.isResetAdded ? ' c-vote-card--reset-added' : ''}`}>
        <CardMedia
          className={`c-vote-card__image-media${image === '/icons/icon-book-256.png' ? ' no-src':''}`}
          image={image}
          title={`${book.title} - ${book.author}`}
        />
        <div className='c-vote-card__padded'>
          <div className='c-vote-card__details'>
            <span className='c-vote-card__title'>{book.title}</span> <span className='c-vote-card__dash'>-</span> <span className='c-vote-card__author'>{book.author || '??'}</span>
          </div>
          <div className='c-vote-card__points'>
            <Select
              className='c-vote-card__point-dropdown'
              value={points}
              onChange={this.onDropdownChange}
              inputProps={{
                name: 'points',
                id: 'book-points',
              }}
            >
              <MenuItem value={3}>3 pts</MenuItem>
              <MenuItem value={2}>2 pts</MenuItem>
              <MenuItem value={1}>1 pt</MenuItem>
              <MenuItem value={0}>0 pts</MenuItem>
            </Select>
          </div>
        </div>
      </Card>
    );

    return (
      <VotePitchTooltip title={book.pitch || 'No pitch provided.'}>
        {card}
      </VotePitchTooltip>
    );
  }

  onDropdownChange = (e) => {
    const points = parseInt(e.target.value);
    if(this.props.onVote) {
      this.props.onVote(this.props.book, points);
    }
  };
}
