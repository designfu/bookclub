import * as React from 'react';
import Typography from '@mui/material/Typography';

export interface CloseVotingResultsListItem {
  key: string | number;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  secondaryFirst?: boolean;
}

export interface CloseVotingResultsListProps {
  items: CloseVotingResultsListItem[];
  stacked?: boolean;
}

export function CloseVotingResultsList({
  items,
  stacked = false,
}: CloseVotingResultsListProps) {
  return (
    <Typography
      component='ol'
      variant='body1'
      sx={{
        display: 'block',
        mt: 0.625,
        mb: 0,
        pl: 3,
      }}
    >
      {items.map((item) => (
        <Typography
          key={item.key}
          component='li'
          variant='body1'
          sx={{
            display: 'list-item',
            color: 'common.black',
            listStyleType: 'decimal',
            pl: '1em',
            mb: 0.25,
            lineHeight: 1.4,
          }}
        >
          {item.secondary && item.secondaryFirst ? (
            <Typography
              component='span'
              variant='body2'
              sx={{
                display: 'inline-block',
                color: 'text.secondary',
              }}
            >
              {item.secondary}
            </Typography>
          ) : null}
          <Typography
            component='span'
            variant='inherit'
            sx={{
              display: stacked ? 'block' : 'inline-block',
              ml: stacked ? 0 : 1.25,
            }}
          >
            {item.primary}
          </Typography>
          {item.secondary && !item.secondaryFirst ? (
            <Typography
              component='span'
              variant='body2'
              sx={{
                display: 'inline-block',
                color: 'text.secondary',
              }}
            >
              {item.secondary}
            </Typography>
          ) : null}
        </Typography>
      ))}
    </Typography>
  );
}
