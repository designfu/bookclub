import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import classnames from 'classnames';
import { Book, BookStatus } from 'types';
import { roundToNearest } from '@shared/utils/math';
import { ConfirmDialog } from 'components/display/ConfirmDialog';
import { toMuiButtonColor } from 'components/display/button-colors';
import { ensureGoodreadsUrlIsShort, ensureGoodreadsUrlIsValid } from 'utils/goodreads';
import { acceptanceVoteResultsString, normalize, pointString } from 'utils/strings';

const ensureProps = (book) => ({
  meta: {},
  pitch: '',
  genre: '',
  status: '',
  ...book,
  links: {
    goodreads: '',
    image: '',
    ...book.links,
  },
  suggestedBy: (book.suggestedBy && typeof book.suggestedBy === 'object') ? {
    name: '',
    ...book.suggestedBy,
  } : (book.suggestedBy || ''),
});

function renderStatus(status, points = null, votes = null) {
  if(status === BookStatus.BACKLOG) return null;
  if(!points && !votes) return null;

  const className = classnames({
    'c-book-card__status': true,
    [`c-book-card__status--${normalize(status)}`]: !!status,
    'has-points': points,
  });
  if (votes) {
    return <Typography variant='caption' component='span' className={className}>{acceptanceVoteResultsString(votes)}</Typography>;
  } else {
    return <Typography variant='caption' component='span' className={className}>{points ? pointString(points) : status}</Typography>;
  }
}

function statusBadgeLabel(status: string): string {
  if (!status) {
    return '';
  }
  const lower = status.toString().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function yourRating(ratings: any[], myId: string) {
  if (!myId) {
    return '';
  }
  const yours = ratings.find((rating) => {
    if (!rating) {
      return false;
    }
    const ratingUser = rating.user && rating.user._id ? rating.user._id : rating.user;
    return ratingUser === myId;
  });
  return yours ? `(you gave ${yours.value})` : '';
}

function formatRating(rating) {
  return Math.trunc(roundToNearest(rating, 0.1) * 10) / 10;
}

export interface BookListItemProps {
  book: Book;
  isAdmin?: boolean;
  myId?: string;
  isNew?: boolean;
  isYourBook?: boolean;
  hideBadges?: boolean;
  showAdminActions?: boolean;
  hidePitch?: boolean;
  onEdit?: Function;
  onDelete?: Function;
  onPropose?: Function;
  onRetract?: Function;
  points?: string|number;
  rankings?: number[];
  borderless?: boolean;
  statusBreak?: boolean;
}

export class BookCard extends React.Component<BookListItemProps, any> {
  state = {
    deleteDialogOpen: false,
  };

  render() {
    const { myId, isAdmin, borderless, statusBreak } = this.props;
    const book = ensureProps(this.props.book);
    const className = classnames('c-book-card', {
      'c-book-card--borderless': borderless,
      'c-book-card--status-break': statusBreak,
    });

    const canEdit = myId === book.suggestedBy || isAdmin;

    const allowDelete = !!isAdmin || !this.props.showAdminActions;
    const actions = {
      edit: canEdit && this.props.onEdit,
      delete: allowDelete && canEdit && this.props.onDelete,
      propose: canEdit && this.props.onPropose && book.status === BookStatus.BACKLOG,
      retract: canEdit && this.props.onRetract && book.status === BookStatus.SUGGESTED,
    };

    const showStatusBadge = !!book.status && book.status !== BookStatus.BACKLOG && !this.props.points && !this.props.rankings;
    const showYourBookBadge = !!this.props.isYourBook;
    const showNewBadge = !!this.props.isNew;
    const showBadges = !this.props.hideBadges && (showStatusBadge || showYourBookBadge || showNewBadge);
    const showPitch = !!book.pitch && !this.props.hidePitch;
    const hasActions = !!(actions.edit || actions.propose || actions.retract || actions.delete);

    return (
      <Card className={className}>
        {showBadges ? (
          <div className='c-book-card__badges-row'>
            <span className='c-book-card__badges'>
              {showStatusBadge ? <span className={`c-book-card__badge c-book-card__badge--${normalize(book.status)}`}>{statusBadgeLabel(book.status)}</span> : null}
              {showYourBookBadge ? <span className='c-book-card__badge c-book-card__badge--your-book'>Your Book</span> : null}
              {showNewBadge ? <span className='c-book-card__badge c-book-card__badge--new'>New</span> : null}
            </span>
          </div>
        ) : null}
        <div className='c-book-card__top'>
          <CardMedia
            className='c-book-card__image-media'
            image={book.links.image ? book.links.image : '/icons/icon-book-256.png'}
            title={`${book.title} - ${book.author}`}
          />
          <div className='c-book-card__details'>
            <CardHeader
              title={book.title}
              subheader={book.author}
            />

            <CardContent className='c-book-card__metadata'>
              {renderStatus(book.status, this.props.points, this.props.rankings)}
              {book.genre ?
                <Typography variant='body2' component='p' className='c-book-card__detail c-book-card__detail--genre'>
                  <Typography variant='subtitle2' component='span'>Genre:</Typography>{' '}
                  <Typography variant='body2' component='span'>{book.genre}</Typography>
                </Typography>
              : null}
              {book.status === BookStatus.FINISHED ?
                <Typography variant='body2' component='p' className='c-book-card__detail c-book-card__detail--rating'>
                  <Typography variant='subtitle2' component='span'>Rating:</Typography>{' '}
                  <Typography variant='body2' component='span'>
                    {book.hasOwnProperty('averageRating') && book.averageRating > -1
                      ? `${formatRating(book.averageRating)} average from ${book.ratings.length} ratings ${yourRating(book.ratings, myId)}`
                      : 'No ratings yet'
                    }
                  </Typography>
                </Typography>
              : null}
              <Typography variant='body2' component='p' className='c-book-card__detail c-book-card__detail--goodreads'>
                <Typography variant='subtitle2' component='span'>Goodreads:</Typography>{' '}
                <Typography variant='body2' component='span'>
                  <a href={book.links.goodreads ? ensureGoodreadsUrlIsValid(book.links.goodreads) : '#'} target='_blank' rel='noreferrer'>{ensureGoodreadsUrlIsShort(book.links.goodreads)}</a>
                </Typography>
              </Typography>
            </CardContent>
          </div>
        </div>
        {showPitch ? (
          <CardContent className='c-book-card__secondary'>
            <Typography variant='body2' component='div' className='c-book-card__detail c-book-card__detail--pitch'>{book.pitch}</Typography>
          </CardContent>
        ) : null}
        {hasActions ? (
          <CardActions className='c-book-card__actions'>
            {actions.edit ? <Button size='small' onClick={this.handleEdit}>Edit</Button> : null}
            {actions.propose ? <Button size='small' onClick={this.handlePropose}>Suggest</Button> : null}
            {actions.retract ? <Button size='small' onClick={this.handleRetract}>Move to backlog</Button> : null}
            <Box sx={{ flexGrow: 1 }} />
            {actions.delete ? <Button size='small' onClick={this.handleDeleteClick} color={toMuiButtonColor('danger')} className='c-book-card__action-delete'>Delete</Button> : null}
          </CardActions>
        ) : null}
        <ConfirmDialog
          open={this.state.deleteDialogOpen}
          title='Delete this book?'
          content={
            <DialogContentText>
              This will remove the book from the list.
            </DialogContentText>
          }
          confirmText='Delete'
          confirmColor='danger'
          onConfirm={this.handleDeleteConfirm}
          onCancel={this.handleDeleteCancel}
        />
      </Card>
    );
  }

  handleEdit = () => {
    this.props.onEdit(this.props.book);
  };

  handleDeleteClick = () => {
    this.setState({
      deleteDialogOpen: true,
    });
  };

  handleDeleteCancel = () => {
    this.setState({
      deleteDialogOpen: false,
    });
  };

  handleDeleteConfirm = () => {
    this.setState({
      deleteDialogOpen: false,
    });
    this.props.onDelete(this.props.book);
  };

  handlePropose = () => {
    this.props.onPropose(this.props.book);
  };

  handleRetract = () => {
    this.props.onRetract(this.props.book);
  };
}
