import * as React from 'react';
import Select, { SelectProps } from '@mui/material/Select';

export const VotingSelect = React.forwardRef(function VotingSelect<T = unknown>(
  props: SelectProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <Select
      ref={ref}
      {...props}
      variant='standard'
    />
  );
});
