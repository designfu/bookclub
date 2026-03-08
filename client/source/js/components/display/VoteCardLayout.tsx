import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

const voteCardLayoutCardSx = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexGrow: 1,
};

const voteCardLayoutBodySx = {
  p: 1,
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
};

const voteCardLayoutDetailsSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flexGrow: 1,
  px: 1.5,
  pl: 0.5,
};

const voteCardLayoutTitleSx = {
  lineHeight: 1.2,
  fontSize: 16,
};

const voteCardLayoutAuthorSx = {
  lineHeight: 1.2,
  color: 'text.secondary',
};

const trailingContentWrapSx = {
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
};

function voteCardMediaSx(resolvedImage: string) {
  const isFallbackImage = resolvedImage === '/icons/icon-book-256.png';
  return {
    backgroundSize: isFallbackImage ? '90%' : 'contain',
    width: 40,
    backgroundPosition: isFallbackImage ? '50% 0' : 'left',
    height: 60,
    flex: '0 0 40px',
  };
}

export interface VoteCardLayoutProps {
  title: string;
  author?: string;
  image?: string;
  trailingContent?: React.ReactNode;
  elevation?: number;
  cardSx?: any;
}

export function VoteCardLayout({
  title,
  author,
  image,
  trailingContent,
  elevation,
  cardSx,
}: VoteCardLayoutProps) {
  const resolvedImage = image || '/icons/icon-book-256.png';

  return (
    <Card elevation={elevation} sx={{ ...voteCardLayoutCardSx, ...cardSx }}>
      <CardMedia
        image={resolvedImage}
        title={`${title} - ${author || '??'}`}
        sx={voteCardMediaSx(resolvedImage)}
      />
      <Box sx={voteCardLayoutBodySx}>
        <Box sx={voteCardLayoutDetailsSx}>
          <Typography variant='body2' sx={voteCardLayoutTitleSx}>
            {title}
          </Typography>
          <Typography variant='caption' sx={voteCardLayoutAuthorSx}>
            {author || '??'}
          </Typography>
        </Box>
        {trailingContent ? (
          <Box sx={trailingContentWrapSx}>
            {trailingContent}
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}
