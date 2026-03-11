import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import DialogContentText from '@mui/material/DialogContentText';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
  const statusSx = {
    position: 'absolute',
    right: 5,
    bottom: 5,
    px: '6px',
    py: '3px',
    borderRadius: '3px',
    backgroundColor: 'grey.200',
    color: 'text.primary',
  };
  if (votes) {
    return <Typography variant='caption' component='span' sx={statusSx}>{acceptanceVoteResultsString(votes)}</Typography>;
  } else {
    return <Typography variant='caption' component='span' sx={statusSx}>{points ? pointString(points) : status}</Typography>;
  }
}

function statusBadgeLabel(status: string): string {
  if (!status) {
    return '';
  }
  const lower = status.toString().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function badgeSx(kind: string) {
  const styles = {
    suggested: { backgroundColor: 'grey.200', color: 'text.primary' },
    reading: { backgroundColor: 'primary.main', color: 'primary.contrastText' },
    finished: { backgroundColor: 'grey.500', color: 'common.white' },
    yourBook: { backgroundColor: 'grey.700', color: 'common.white' },
    new: { backgroundColor: 'success.dark', color: 'common.white' },
  };

  return {
    borderRadius: 0,
    flex: '1 1 0',
    minWidth: 0,
    height: 'auto',
    '& .MuiChip-label': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      px: 1,
      py: 0.375,
      fontSize: '10px',
      lineHeight: 1.5,
      textTransform: 'uppercase',
    },
    ...(styles[kind] || {}),
  };
}

function MetadataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction='row' spacing={0.5} alignItems='flex-start'>
      <Typography variant='subtitle2' component='span'>
        {label}:
      </Typography>
      <Typography variant='body2' component='span'>
        {children}
      </Typography>
    </Stack>
  );
}

const cardSx = {
  minWidth: {
    xs: 0,
    md: 500,
  },
  width: '100%',
  maxWidth: 'none',
  position: 'relative',
  m: 0,
  display: 'block',
};

const borderlessCardSx = {
  m: 0,
  minWidth: 'initial',
  maxWidth: 'initial',
  boxShadow: 'none',
};

const topSectionSx = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  position: 'relative',
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const detailsSx = {
  '& .MuiCardHeader-root': {
    px: 2,
    pt: 1.5,
    pb: 1,
  },
};

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
      <Card
        sx={{
          ...cardSx,
          ...(borderless ? borderlessCardSx : {}),
          ...(statusBreak ? { mt: '44px' } : {}),
        }}
      >
        {showBadges ? (
          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              zIndex: 2,
            }}
          >
            <Stack direction='row'>
              {showStatusBadge ? (
                <Chip
                  label={statusBadgeLabel(book.status)}
                  size='small'
                  sx={badgeSx(normalize(book.status))}
                />
              ) : null}
              {showYourBookBadge ? (
                <Chip
                  label='Your Book'
                  size='small'
                  sx={badgeSx('yourBook')}
                />
              ) : null}
              {showNewBadge ? (
                <Chip
                  label='New'
                  size='small'
                  sx={badgeSx('new')}
                />
              ) : null}
            </Stack>
          </Box>
        ) : null}
        <Box sx={topSectionSx}>
          <CardMedia
            image={book.links.image ? book.links.image : '/icons/icon-book-256.png'}
            title={`${book.title} - ${book.author}`}
            sx={{
              width: 112,
              maxWidth: 112,
              minWidth: 112,
              flex: '0 0 112px',
              alignSelf: 'flex-start',
              height: 170,
            }}
          />
          <Box sx={detailsSx}>
            <CardHeader
              title={book.title}
              subheader={book.author}
            />

            <CardContent sx={{ pt: 0.75 }}>
              {renderStatus(book.status, this.props.points, this.props.rankings)}
              <Stack spacing={0}>
                {book.genre ? (
                  <MetadataRow label='Genre'>{book.genre}</MetadataRow>
                ) : null}
                {book.status === BookStatus.FINISHED ? (
                  <MetadataRow label='Rating'>
                    {book.hasOwnProperty('averageRating') && book.averageRating > -1
                      ? `${formatRating(book.averageRating)} average from ${book.ratings.length} ratings ${yourRating(book.ratings, myId)}`
                      : 'No ratings yet'
                    }
                  </MetadataRow>
                ) : null}
                <MetadataRow label='Goodreads'>
                  <Link
                    href={book.links.goodreads ? ensureGoodreadsUrlIsValid(book.links.goodreads) : '#'}
                    target='_blank'
                    rel='noreferrer'
                    underline='hover'
                  >
                    {ensureGoodreadsUrlIsShort(book.links.goodreads)}
                  </Link>
                </MetadataRow>
              </Stack>
            </CardContent>
          </Box>
        </Box>
        {showPitch ? (
          <CardContent>
            <Typography
              variant='body2'
              component='div'
              sx={{
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {book.pitch}
            </Typography>
          </CardContent>
        ) : null}
        {hasActions ? (
          <CardActions>
            {actions.edit ? <Button size='small' onClick={this.handleEdit}>Edit</Button> : null}
            {actions.propose ? <Button size='small' onClick={this.handlePropose}>Suggest</Button> : null}
            {actions.retract ? <Button size='small' onClick={this.handleRetract}>Move to backlog</Button> : null}
            <Box sx={{ flexGrow: 1 }} />
            {actions.delete ? (
              <Button
                size='small'
                onClick={this.handleDeleteClick}
                color={toMuiButtonColor('danger')}
              >
                Delete
              </Button>
            ) : null}
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
