import * as React from 'react';
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

export const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    textAlign: 'left',
    border: '1px solid #ddd',
    fontWeight: 400,
    '& strong, & b': {
      fontWeight: 400,
    },
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.white,
    '&:before': {
      border: '1px solid #ddd',
    },
  },
}));
