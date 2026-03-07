import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDragLayer } from 'react-dnd';
import { LightTooltip } from 'components/display/LightTooltip';

export interface VotePitchTooltipProps {
  title: string;
  children: any;
}

export function VotePitchTooltip({ title, children }: VotePitchTooltipProps) {
  const isTouchDevice = useMediaQuery('(hover: none), (pointer: coarse)');
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));
  const [open, setOpen] = React.useState(false);

  const disableTooltip = isTouchDevice || isDragging;
  const isOpen = !disableTooltip && open;

  React.useEffect(() => {
    if (disableTooltip) {
      setOpen(false);
    }
  }, [disableTooltip]);

  return (
    <LightTooltip
      title={title}
      placement='right'
      arrow
      open={isOpen}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disableHoverListener={disableTooltip}
      disableFocusListener={disableTooltip}
      disableTouchListener={disableTooltip}
    >
      {children}
    </LightTooltip>
  );
}
