import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface VoteCardDividerProps {
}

export class VoteCardDivider extends React.Component<VoteCardDividerProps, any> {
  render() {
    return (
      <Box
        sx={{
          width: '100%',
          py: 1.5,
          px: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            alignItems: 'center',
            textTransform: 'uppercase',
            color: 'text.secondary',
            '&:before, &:after': {
              content: '""',
              flex: '1 1 auto',
              borderTop: '1px solid',
              borderColor: 'divider',
            },
            '&:before': {
              mr: 1.5,
            },
            '&:after': {
              ml: 1.5,
            },
          }}
        >
          <Typography
            variant='caption'
            sx={{
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}
          >
            No Interest Below This Line
          </Typography>
        </Box>
      </Box>
    );
  }
}
