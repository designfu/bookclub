import * as React from 'react';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import { Book } from 'types';
import { LightTooltip } from 'components/display/LightTooltip';

export interface VoteCardProps {
  book: Book;
  i: number;
  points: number;
  onVote?: Function;
}

export class VoteCard extends React.Component<VoteCardProps, any> {
  render() {
    const { book, points } = this.props;
    const image = (book && book.links && book.links.image) ? book.links.image : '/icons/icon-book-256.png';

    return (
      <Card className='c-vote-card'>
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
            <LightTooltip
              title={book.pitch || 'No pitch provided.'}
              placement='right'
              arrow
            >
              <IconButton className='c-vote-card__help' size='small' aria-label='Show pitch'>
                <ChatBubbleOutlineIcon fontSize='small' />
              </IconButton>
            </LightTooltip>
          </div>
        </div>
      </Card>
    );
  }

  onDropdownChange = (e) => {
    const points = parseInt(e.target.value);
    if(this.props.onVote) {
      this.props.onVote(this.props.book, points);
    }
  };
}
