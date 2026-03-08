import * as React from 'react';
import Box from '@mui/material/Box';
import { Link, useLocation } from 'react-router-dom';

export interface NavTabProps {
  to: string;
}

export function NavTab(props: React.PropsWithChildren<NavTabProps>) {
  const location = useLocation();
  const isActive = location.pathname === props.to;

  return (
    <Box
      component='li'
      sx={{
        display: 'inline-flex',
        alignItems: 'stretch',
        cursor: 'pointer',
        boxSizing: 'border-box',
        p: 0,
        m: 0,
        lineHeight: 1,
      }}
    >
      <Box
        component={Link}
        to={props.to}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: isActive ? 'text.primary' : 'text.secondary',
          px: 2,
          py: 1,
          borderBottom: '2px solid',
          borderColor: isActive ? 'primary.main' : 'transparent',
          '&:hover': {
            color: 'text.primary',
            borderColor: 'primary.main',
          },
        }}
      >
        {props.children}
      </Box>
    </Box>
  );
}
