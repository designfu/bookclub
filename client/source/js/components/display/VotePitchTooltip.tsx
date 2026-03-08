import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LightTooltip } from 'components/display/LightTooltip';

const REORDER_STARTED_EVENT = 'vote-pitch-tooltip-reorder-started';
const REORDER_COMPLETE_EVENT = 'vote-pitch-tooltip-reorder-complete';

export interface VotePitchTooltipProps {
  title: string;
  children: any;
  disabled?: boolean;
}

export function VotePitchTooltip({ title, children, disabled = false }: VotePitchTooltipProps) {
  const isTouchDevice = useMediaQuery('(hover: none), (pointer: coarse)');
  const [open, setOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [reorderInProgress, setReorderInProgress] = React.useState(false);

  // During drag sessions, mouse and focus events are not fired. This leaves tooltips
  // out of sync as the mouse might not be over the voting card anymore.
  // To keep tooltips in sync, we close them during reorder operations, and wait
  // for a mouse moved event to re-arm them afterwards. This also fixes prop updates.
  const suppressHoverUntilMouseMove = React.useCallback(() => {
    setBlockOpen(true);

    const handleMouseMove = () => {
      setBlockOpen(false);
      window.removeEventListener('mousemove', handleMouseMove);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const disableTooltip = disabled || isTouchDevice || reorderInProgress;
  const isOpen = !disableTooltip && open;

  const handleOpen = React.useCallback(() => {
    if (blockOpen) {
      return;
    }
    setOpen(true);
  }, [blockOpen]);

  React.useEffect(() => {
    if (disableTooltip) {
      setOpen(false);
    }
  }, [disableTooltip]);

  React.useEffect(() => {
    const handleReorderStarted = () => {
      setOpen(false);
      setReorderInProgress(true);
    };
    const handleReorderComplete = () => {
      setOpen(false);
      setReorderInProgress(false);
      suppressHoverUntilMouseMove();
    };

    window.addEventListener(REORDER_STARTED_EVENT, handleReorderStarted);
    window.addEventListener(REORDER_COMPLETE_EVENT, handleReorderComplete);
    return () => {
      window.removeEventListener(REORDER_STARTED_EVENT, handleReorderStarted);
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
    >
      {children}
    </LightTooltip>
  );
}
