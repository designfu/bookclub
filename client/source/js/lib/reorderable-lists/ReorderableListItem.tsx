import * as React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import ListItem from '@mui/material/ListItem';

const style = {
  cursor: 'move',
};

const LIST_ITEM_TYPE = 'listItem';

interface DragItem {
  id: string | number;
  index: number;
}

interface ReorderableListItemProps {
  id: string | number;
  index: number;
  moveListItem: (dragIndex: number, hoverIndex: number) => void;
  handleOnClick: () => void;
  children: React.ReactNode;
}

const ReorderableListItem = (props: ReorderableListItemProps) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { id, index, moveListItem, handleOnClick, children } = props;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: LIST_ITEM_TYPE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, index]);

  const [, drop] = useDrop<DragItem, void, unknown>(() => ({
    accept: LIST_ITEM_TYPE,
    hover(item, monitor) {
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      const node = ref.current;
      if (!node) {
        return;
      }

      const hoverBoundingRect = node.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveListItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  }), [index, moveListItem]);

  drag(drop(ref));

  const opacity = isDragging ? 0 : 1;

  return (
    <div ref={ref} style={{ ...style, opacity }}>
      <ListItem onClick={handleOnClick}>{children}</ListItem>
    </div>
  );
};

export default ReorderableListItem;
