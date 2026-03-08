import * as React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';

const style = {
  cursor: 'move',
  userSelect: 'none' as const,
  WebkitUserSelect: 'none' as const,
  WebkitTouchCallout: 'none' as const,
};

const LIST_ITEM_TYPE = 'listItem';
const HOVER_INSET_RATIO = 0.12;

interface DragItem {
  id: string | number;
  index: number;
}

export interface ReorderableListItemProps {
  id: string | number;
  index: number;
  moveListItem: (dragIndex: number, hoverIndex: number) => void;
  handleDragStart: (id: string | number) => void;
  handleDragEnd: (didDropOnTarget: boolean) => void;
  offsetY?: number;
  animateReorder?: boolean;
  transitionDurationMs?: number;
  transitionEasing?: string;
  hoverInsetRatio?: number;
  reorderTrigger?: 'edge' | 'midpoint';
  hideDraggedSource?: boolean;
  contentStyle?: React.CSSProperties;
  contentProps?: React.HTMLAttributes<HTMLDivElement>;
  onMeasureRef?: (id: string | number, node: HTMLDivElement | null) => void;
  handleItemClick: () => void;
  children: React.ReactNode;
}

function clampHoverInsetRatio(value: number) {
  if (Number.isNaN(value)) {
    return HOVER_INSET_RATIO;
  }
  return Math.max(0, Math.min(0.49, value));
}

const ReorderableListItem = (props: ReorderableListItemProps) => {
  const theme = useTheme();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const {
    id,
    index,
    moveListItem,
    offsetY = 0,
    animateReorder = false,
    transitionDurationMs = theme.transitions.duration.shortest,
    transitionEasing = theme.transitions.easing.easeOut,
    hoverInsetRatio = HOVER_INSET_RATIO,
    reorderTrigger = 'edge',
    hideDraggedSource = true,
    contentStyle,
    contentProps,
    onMeasureRef,
    handleItemClick,
    children,
  } = props;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: LIST_ITEM_TYPE,
    item: () => {
      props.handleDragStart(id);
      return { id, index };
    },
    end: (_item, monitor) => {
      props.handleDragEnd(monitor.didDrop());
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, index, props]);

  const [, drop] = useDrop<DragItem, void, unknown>(() => ({
    accept: LIST_ITEM_TYPE,
    drop: () => ({}),
    hover(item, monitor) {
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      if (item.id === id) {
        return;
      }

      const node = ref.current;
      if (!node) {
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverBoundingRect = node.getBoundingClientRect();
      const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverRatio = hoverHeight > 0 ? hoverClientY / hoverHeight : 0.5;
      const insetRatio = clampHoverInsetRatio(hoverInsetRatio);

      if (reorderTrigger === 'midpoint') {
        const hoverMiddleY = hoverHeight / 2;
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
      } else {
        // Use a slightly smaller target zone inside each card to reduce
        // flip-flop when the pointer sits near card boundaries.
        if (hoverRatio < insetRatio || hoverRatio > (1 - insetRatio)) {
          return;
        }
      }

      moveListItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  }), [id, index, moveListItem, hoverInsetRatio, reorderTrigger]);

  drag(drop(ref));

  const opacity = (isDragging && hideDraggedSource) ? 0 : 1;
  const transition = animateReorder
    ? theme.transitions.create('transform', {
      duration: transitionDurationMs,
      easing: transitionEasing,
    })
    : 'none';
  const transform = `translateY(${offsetY}px)`;

  return (
    <div
      ref={(node) => {
        ref.current = node;
        if (onMeasureRef) {
          onMeasureRef(id, node);
        }
      }}
      style={{ ...style, opacity }}
    >
      <div
        style={{
          transform,
          transition,
          ...contentStyle,
        }}
        {...contentProps}
      >
        <ListItem onClick={handleItemClick}>{children}</ListItem>
      </div>
    </div>
  );
};

export default ReorderableListItem;
