import * as React from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { MultiBackend } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import ReorderableList, { ReorderableListProps } from './ReorderableList';
import ReorderableVotingListItem from './ReorderableVotingListItem';

const TOUCH_DRAG_DELAY_MS = 140;

const HTML5toTouchWithDelay = {
  ...HTML5toTouch,
  backends: HTML5toTouch.backends.map((backend: any) => (
    backend.id === 'touch'
      ? {
        ...backend,
        options: {
          ...(backend.options && typeof backend.options === 'object' ? backend.options : {}),
          delayTouchStart: TOUCH_DRAG_DELAY_MS,
        },
      }
      : backend
  )),
};

type ReorderableVotingListProps = Omit<ReorderableListProps, 'enableTransitions' | 'listSx'> & {
  listSx?: ReorderableListProps['listSx'];
};

class ReorderableVotingList extends React.Component<ReorderableVotingListProps> {
  render() {
    const { listSx, ...props } = this.props;
    const mergedListSx = [{ maxWidth: 400 }, listSx].filter(Boolean) as SxProps<Theme>;
    return (
      <ReorderableList
        {...props}
        enableTransitions
        transitionDurationMs={180}
        transitionEasing='ease-out'
        hoverInsetRatio={0.12}
        reorderTrigger='edge'
        hideDraggedSource
        onUpdateMode='during-drag'
        restoreOnFailedDrop
        syncChildrenWhileDragging
        listSx={mergedListSx}
        dndBackend={MultiBackend}
        dndBackendOptions={HTML5toTouchWithDelay}
        itemComponent={ReorderableVotingListItem}
        itemComponentProps={{
          touchHighlightDelayMs: TOUCH_DRAG_DELAY_MS,
        }}
      />
    );
  }
}

export default ReorderableVotingList;
