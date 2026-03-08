import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { VoteCardLayout } from 'components/display/VoteCardLayout';

export interface VoteResultCardBaseProps {
  title: string;
  author?: string;
  image?: string;
  primaryText: string;
  secondaryText?: string;
  isSmallScreen?: boolean;
}

export function VoteResultCardBase({
  title,
  author,
  image,
  primaryText,
  secondaryText,
  isSmallScreen = false,
}: VoteResultCardBaseProps) {
  return (
    <VoteCardLayout
      title={title}
      author={author}
      image={image}
      cardSx={{
        boxShadow: 'none',
        borderTop: '1px solid',
        borderColor: 'divider',
        minWidth: isSmallScreen ? 560 : undefined,
      }}
      trailingContent={
        <Stack
          sx={{
            alignItems: secondaryText ? 'flex-end' : 'center',
            justifyContent: 'center',
            gap: secondaryText ? 0.375 : 0,
          }}
        >
          <Typography variant='body2'>
            {primaryText}
          </Typography>
          {secondaryText ? (
            <Typography variant='caption' sx={{ color: 'text.secondary', textAlign: 'right' }}>
              {secondaryText}
            </Typography>
          ) : null}
        </Stack>
      }
    />
  );
}
