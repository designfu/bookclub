import * as React from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { Book } from 'types';
import { pointString } from 'utils/strings';

export interface VoteResultCardProps {
  book: Book;
}

export class VoteResultCardWeighted extends React.Component<VoteResultCardProps, any> {
  render() {
    const { book } = this.props;
    const image = (book && book.links && book.links.image) ? book.links.image : '/icons/icon-book-256.png';

    return (
      <Card className='c-vote-card c-vote-card--result'>
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
            <span className='c-vote-card__points-text'>{pointString(book.points)}</span>
          </div>
        </div>
      </Card>
    );
  }
}
