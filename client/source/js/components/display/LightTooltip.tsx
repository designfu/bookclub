import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

export const LightTooltip = withStyles((theme: any) => ({
  tooltip: {
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
  arrow: {
    color: theme.palette.common.white,
    '&:before': {
      border: '1px solid #ddd',
    },
  },
}))(Tooltip as any);
