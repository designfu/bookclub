import type { SxProps, Theme } from '@mui/material/styles';

export const dropdownFormControlSx: SxProps<Theme> = {
  minWidth: 200,
  maxWidth: '90%',
};

export const dialogDropdownFormControlSx: SxProps<Theme> = {
  ...dropdownFormControlSx,
  mb: 2.5,
};

export const responsiveDropdownFormControlSx: SxProps<Theme> = {
  minWidth: { xs: '100%', sm: 280 },
  maxWidth: '90%',
};
