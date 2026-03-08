import * as React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ReorderableListItem, { ReorderableListItemProps } from './ReorderableListItem';

export interface ReorderableVotingListItemProps extends ReorderableListItemProps {
  touchHighlightDelayMs?: number;
}

const ReorderableVotingListItem = (props: ReorderableVotingListItemProps) => {
  const theme = useTheme();
  const isTouchDevice = useMediaQuery('(hover: none), (pointer: coarse)');
  const {
    hideDraggedSource = true,
    contentStyle,
    contentProps,
    touchHighlightDelayMs = 120,
    ...rest
  } = props;
  const [isPressed, setIsPressed] = React.useState(false);
  const highlightDelayRef = React.useRef<number | null>(null);

  const clearHighlightDelay = React.useCallback(() => {
    if (highlightDelayRef.current) {
      window.clearTimeout(highlightDelayRef.current);
      highlightDelayRef.current = null;
    }
  }, []);

  React.useEffect(() => () => {
    clearHighlightDelay();
  }, [clearHighlightDelay]);

  const handleTouchState = React.useCallback((pressed: boolean) => {
    clearHighlightDelay();
    setIsPressed(pressed);
  }, [clearHighlightDelay]);

  return (
    <ReorderableListItem
      {...rest}
      hideDraggedSource={hideDraggedSource && !isTouchDevice}
      contentStyle={{
        ...((isTouchDevice && isPressed) ? {
          backgroundColor: theme.palette.action.selected,
          borderRadius: theme.shape.borderRadius,
        } : {}),
        ...contentStyle,
      }}
      contentProps={{
        ...contentProps,
        onTouchStart: (event) => {
          if (isTouchDevice) {
            clearHighlightDelay();
            highlightDelayRef.current = window.setTimeout(() => {
              setIsPressed(true);
              highlightDelayRef.current = null;
            }, touchHighlightDelayMs);
          }
          if (contentProps && contentProps.onTouchStart) {
            contentProps.onTouchStart(event);
          }
        },
        onTouchEnd: (event) => {
          handleTouchState(false);
          if (contentProps && contentProps.onTouchEnd) {
            contentProps.onTouchEnd(event);
          }
        },
        onTouchCancel: (event) => {
          handleTouchState(false);
          if (contentProps && contentProps.onTouchCancel) {
            contentProps.onTouchCancel(event);
          }
        },
      }}
    />
  );
};

export default ReorderableVotingListItem;
