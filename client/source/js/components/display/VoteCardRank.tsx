import * as React from 'react';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import { Book } from 'types';
import { rankString } from '@client/utils/strings';
import { LightTooltip } from 'components/display/LightTooltip';

export interface VoteCardRankProps {
  book: Book;
  i: number;
  rank: number;
  maxRank: number;
  onVote?: Function;
}

function PitchTooltip(props) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <LightTooltip
      title={props.title}
      placement='right'
      arrow
      disableHoverListener={isSmall}
      disableTouchListener={isSmall}
    >
      {props.children}
    </LightTooltip>
  );
}

export class VoteCardRank extends React.Component<VoteCardRankProps, any> {
  render() {
    const { book, rank, maxRank } = this.props;
    const image = (book && book.links && book.links.image) ? book.links.image : '/icons/icon-book-256.png';

    const card = (
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
              value={rank}
              onChange={this.onDropdownChange}
              inputProps={{
                name: 'points',
                id: 'book-points',
              }}
            >
              {Array.from({ length: maxRank }, (_, i) =>
                <MenuItem key={i} value={i}>{rankString(i)}</MenuItem>
              )}
              <MenuItem key={-1} value={-1}>{rankString(-1)}</MenuItem>
            </Select>
          </div>
        </div>
      </Card>
    );

    return (
      <PitchTooltip title={book.pitch || 'No pitch provided.'}>
        {card}
      </PitchTooltip>
    );
  }

  onDropdownChange = (e) => {
    const points = parseInt(e.target.value);
    if(this.props.onVote) {
      this.props.onVote(this.props.book, points);
    }
  };
}
