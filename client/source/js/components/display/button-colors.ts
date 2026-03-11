import { ButtonProps } from '@mui/material/Button';

export type SemanticButtonColor = ButtonProps['color'] | 'danger';

export function toMuiButtonColor(color?: SemanticButtonColor): ButtonProps['color'] {
  if (!color) {
    return 'primary';
  }
  return color === 'danger' ? 'error' : color;
}
