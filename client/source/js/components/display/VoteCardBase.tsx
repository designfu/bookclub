import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/material/styles';

const voteCardBaseCardSx = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexGrow: 1,
};

const voteCardBaseBodySx = {
  p: 1,
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
};

const voteCardBaseDetailsSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flexGrow: 1,
  px: 1.5,
  pl: 0.5,
};

const voteCardBaseTitleSx = {
  lineHeight: 1.2,
  fontSize: 16,
};

const voteCardBaseAuthorSx = {
  lineHeight: 1.2,
  color: 'text.secondary',
};

const voteCardBaseTrailingSx = {
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
};

function voteCardBaseMediaSx(resolvedImage: string) {
  const isFallbackImage = resolvedImage === '/icons/icon-book-256.png';
  return {
    backgroundSize: isFallbackImage ? '90%' : 'contain',
    width: 40,
    backgroundPosition: isFallbackImage ? '50% 0' : 'left',
    height: 60,
    flex: '0 0 40px',
  };
}

export interface VoteCardBaseProps {
  bookTitle: string;
  bookAuthor?: string;
  image?: string;
  trailingContent?: React.ReactNode;
  elevation?: number;
  sx?: SxProps<Theme>;
  newlySuggested?: boolean;
}

export const VoteCardBase = React.forwardRef<HTMLDivElement, VoteCardBaseProps>(function VoteCardBase({
  bookTitle,
  bookAuthor,
  image,
  trailingContent,
  elevation,
  sx,
  newlySuggested = false,
  ...props
}: VoteCardBaseProps, ref) {
  const resolvedImage = image || '/icons/icon-book-256.png';
  const cardSx: SxProps<Theme> = [
    voteCardBaseCardSx,
    {
      cursor: 'move',
      ...(newlySuggested ? { backgroundColor: '#e8f5e9' } : {}),
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  return (
    <Card
      ref={ref}
      elevation={elevation}
      {...props}
      sx={cardSx}
    >
      <CardMedia
        image={resolvedImage}
        title={`${bookTitle} - ${bookAuthor || '??'}`}
        sx={voteCardBaseMediaSx(resolvedImage)}
      />
      <Box sx={voteCardBaseBodySx}>
        <Box sx={voteCardBaseDetailsSx}>
          <Typography variant='body2' sx={voteCardBaseTitleSx}>
            {bookTitle}
          </Typography>
          <Typography variant='caption' sx={voteCardBaseAuthorSx}>
            {bookAuthor || '??'}
          </Typography>
        </Box>
        {trailingContent ? (
          <Box sx={voteCardBaseTrailingSx}>
            {trailingContent}
          </Box>
        ) : null}
      </Box>
    </Card>
  );
});
