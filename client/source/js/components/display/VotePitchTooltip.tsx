import * as React from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import { LightTooltip } from 'components/display/LightTooltip';

export interface VotePitchTooltipProps {
  title: string;
  children: any;
}

export function VotePitchTooltip({ title, children }: VotePitchTooltipProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const onDragStart = () => setIsDragging(true);
    const onDragEnd = () => setIsDragging(false);

    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('dragend', onDragEnd);
    return () => {
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('dragend', onDragEnd);
    };
  }, []);

  const disableTooltip = isSmall || isDragging;

  return (
    <LightTooltip
      title={title}
      placement='right'
      arrow
      open={disableTooltip ? false : undefined}
      disableHoverListener={disableTooltip}
      disableFocusListener={disableTooltip}
      disableTouchListener={disableTooltip}
    >
      {children}
    </LightTooltip>
  );
}

