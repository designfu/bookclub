import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDragLayer } from 'react-dnd';
import { LightTooltip } from 'components/display/LightTooltip';

export interface VotePitchTooltipProps {
  title: string;
  children: any;
  disabled?: boolean;
}

export function VotePitchTooltip({ title, children, disabled = false }: VotePitchTooltipProps) {
  const isTouchDevice = useMediaQuery('(hover: none), (pointer: coarse)');
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));
  const [open, setOpen] = React.useState(false);

  const disableTooltip = disabled || isTouchDevice || isDragging;
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
