import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDragLayer } from 'react-dnd';
import { LightTooltip } from 'components/display/LightTooltip';

const REORDER_COMPLETE_EVENT = 'vote-pitch-tooltip-reorder-complete';

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
  const [suppressHoverOpen, setSuppressHoverOpen] = React.useState(false);
  const wasDraggingRef = React.useRef(false);

  const suppressHoverUntilMouseMove = React.useCallback(() => {
    setSuppressHoverOpen(true);

    const handleMouseMove = () => {
      setSuppressHoverOpen(false);
      window.removeEventListener('mousemove', handleMouseMove);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const disableTooltip = disabled || isTouchDevice || isDragging;
  const isOpen = !disableTooltip && open;

  const handleOpen = React.useCallback(() => {
    if (suppressHoverOpen) {
      return;
    }
    setOpen(true);
  }, [suppressHoverOpen]);

  React.useEffect(() => {
    if (disableTooltip) {
      setOpen(false);
    }
  }, [disableTooltip]);

  React.useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
      setSuppressHoverOpen(true);
      return;
    }

    if (!wasDraggingRef.current) {
      return;
    }
    wasDraggingRef.current = false;

    // Safari can emit stray mouseenter/mouseleave after drag or when elements have moved.
    // Keep hover-tooltips disabled until the pointer actually moves again via mousemove.
    return suppressHoverUntilMouseMove();
  }, [isDragging, suppressHoverUntilMouseMove]);

  React.useEffect(() => {
    const handleReorderComplete = () => {
      setOpen(false);
      suppressHoverUntilMouseMove();
    };

    window.addEventListener(REORDER_COMPLETE_EVENT, handleReorderComplete);
    return () => {
      window.removeEventListener(REORDER_COMPLETE_EVENT, handleReorderComplete);
    };
  }, [suppressHoverUntilMouseMove]);

  return (
    <LightTooltip
      title={title}
      placement='right'
      arrow
      open={isOpen}
      onOpen={handleOpen}
      onClose={() => setOpen(false)}
      disableHoverListener={disableTooltip}
      disableFocusListener={disableTooltip}
      disableTouchListener={disableTooltip}
    >
      {children}
    </LightTooltip>
  );
}
