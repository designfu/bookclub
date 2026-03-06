import * as React from 'react';
import DialogContentText from '@material-ui/core/DialogContentText';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import TextField from '@material-ui/core/TextField/TextField';
import { RatingDescriptions } from 'components/display/season-info-common';

export interface RateBookDialogContentProps {
  id: string;
  value: number | string;
  isValid: boolean;
  onValueChange: (value: number) => void;
  onSubmit: (event?) => void;
}

export function RateBookDialogContent({
  id,
  value,
  isValid,
  onValueChange,
  onSubmit,
}: RateBookDialogContentProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <FormControl error={!isValid}>
        <TextField
          id={id}
          label='Your Rating'
          className='o-field o-field--text'
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
          margin='normal'
          type='number'
          inputProps={{
            min: 1.0,
            max: 5.0,
            step: 0.1,
          }}
        />

        <FormHelperText>{isValid ? '' : 'Rating must be between 1 and 5'}</FormHelperText>

        {RatingDescriptions.map((description, i) =>
          <DialogContentText className='c-season-info__rating-description' key={i}>{description}</DialogContentText>
        )}
      </FormControl>
    </form>
  );
}
