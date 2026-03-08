import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import List from '@mui/material/List';
import type { ListProps } from '@mui/material/List';
import type { SxProps, Theme } from '@mui/material/styles';
import ReorderableListItem, { ReorderableListItemProps } from './ReorderableListItem';

const REORDER_TRANSITION_MS = 180;

type ReorderTrigger = 'edge' | 'midpoint';
type OnUpdateMode = 'during-drag' | 'on-drop';

export interface ReorderableListProps {
  children: React.ReactNode;
  onItemClick?: (itemKey: string | number) => void;
  onDragStart?: (itemKey: string | number) => void;
  onDragEnd?: (didDropOnTarget: boolean) => void;
  /** Called with reordered items; timing is controlled by `onUpdateMode`. */
  onUpdate?: (items: React.ReactElement[]) => void;
  /** Called after a reorder has fully settled, immediately or after transition. */
  onReorderComplete?: (items: React.ReactElement[]) => void;
  /** Enables FLIP transform animation for reordering. */
  enableTransitions?: boolean;
  /** Transition duration for reorder transforms, in ms. */
  transitionDurationMs?: number;
  /** Transition easing for reorder transforms. */
  transitionEasing?: string;
  /**
   * Edge dead-zone ratio used when `reorderTrigger='edge'`.
   * Values are clamped to [0, 0.49].
   */
  hoverInsetRatio?: number;
  /** Reorder threshold strategy. */
  reorderTrigger?: ReorderTrigger;
  /** Hides the source row while native HTML5 drag preview is active. */
  hideDraggedSource?: boolean;
  /** Controls when `onUpdate` is emitted. */
  onUpdateMode?: OnUpdateMode;
  /** Restores pre-drag item order when drag ends without a successful drop target. */
  restoreOnFailedDrop?: boolean;
  /**
   * While dragging, merge updated child content by key without replacing local drag order.
   */
  syncChildrenWhileDragging?: boolean;
  /** Pass-through props for MUI List (except `children`). */
  listProps?: Omit<ListProps, 'children'>;
  /** `sx` passthrough for the MUI List. */
  listSx?: SxProps<Theme>;
  /** DnD backend for DndProvider. Default: HTML5Backend. */
  dndBackend?: any;
  /** Optional backend options for DndProvider. */
  dndBackendOptions?: any;
  /** Optional item component override for app-specific row behavior. */
  itemComponent?: React.ComponentType<any>;
  /** Extra props forwarded to each item component. */
  itemComponentProps?: Record<string, any>;
}

interface ReorderableListState {
  items: React.ReactElement[];
  isDragging: boolean;
  transformsById: Record<string | number, number>;
  animateReorder: boolean;
}

class ReorderableList extends React.Component<ReorderableListProps, ReorderableListState> {
  itemNodesById: Record<string | number, HTMLDivElement | null>;
  clearTransitionTimer: number | null;
  itemsBeforeDrag: React.ReactElement[] | null;
  draggedItemId: string | number | null;
  pendingReorderCompleteItems: React.ReactElement[] | null;
  didReorderDuringDrag: boolean;
  transitionRunId: number;

  constructor(props: ReorderableListProps) {
    super(props);

    this.state = {
      items: this.toItemList(props.children),
      isDragging: false,
      transformsById: {},
      animateReorder: false,
    };
    this.itemNodesById = {};
    this.clearTransitionTimer = null;
    this.itemsBeforeDrag = null;
    this.draggedItemId = null;
    this.pendingReorderCompleteItems = null;
    this.didReorderDuringDrag = false;
    this.transitionRunId = 0;

    this.handleItemClick = this.handleItemClick.bind(this);
    this.moveListItem = this.moveListItem.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleItemRef = this.handleItemRef.bind(this);
  }

  handleItemClick(itemKey: string | number) {
    if (this.props.onItemClick) {
      this.props.onItemClick(itemKey);
    }
  }

  moveListItem(dragIndex: number, hoverIndex: number) {
    if (dragIndex === hoverIndex) {
      return;
    }
    const enableTransitions = !!this.props.enableTransitions;
    const onUpdateMode: OnUpdateMode = this.props.onUpdateMode || 'on-drop';
    const previousItems = this.toItemList(this.state.items);
    const previousTopsById = enableTransitions
      ? this.captureItemTopsById(previousItems)
      : {};
    const affectedIds = enableTransitions
      ? new Set(
        update(previousItems, {
          $splice: [[dragIndex, 1], [hoverIndex, 0, previousItems[dragIndex]]],
        })
          .slice(Math.min(dragIndex, hoverIndex), Math.max(dragIndex, hoverIndex) + 1)
          .map((item, idx) => this.toItemKey(item, idx)),
      )
      : null;

    this.setState((prevState) => {
      const items = this.toItemList(prevState.items);
      const dragItem = items[dragIndex];
      const nextItems = update(items, {
        $splice: [[dragIndex, 1], [hoverIndex, 0, dragItem]],
      });
      return { items: nextItems };
    }, () => {
      this.didReorderDuringDrag = this.state.isDragging || this.didReorderDuringDrag;
      this.pendingReorderCompleteItems = this.toItemList(this.state.items);
      if (this.props.onUpdate && onUpdateMode === 'during-drag') {
        this.props.onUpdate(this.toItemList(this.state.items));
      }
      if (enableTransitions) {
        this.applyReorderTransition(previousTopsById, affectedIds, undefined, !this.state.isDragging);
        return;
      }
      if (!this.state.isDragging) {
        this.notifyReorderComplete();
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children) {
      const nextItems = this.toItemList(this.props.children);
      const currentItems = this.toItemList(this.state.items);
      if (this.state.isDragging) {
        if (!this.shouldSyncChildrenWhileDragging()) {
          return;
        }
        const nextByKey = nextItems.reduce((acc, item, idx) => {
          const key = this.toItemKey(item, idx);
          acc[key] = item;
          return acc;
        }, {} as Record<string | number, React.ReactElement>);
        const mergedItems = currentItems
          .map((item, idx) => nextByKey[this.toItemKey(item, idx)] || item)
          .filter((item) => !!item);
        const hasSameKeysInOrder = this.signatureOf(mergedItems) === this.signatureOf(currentItems);
        if (!hasSameKeysInOrder) {
          return;
        }
        this.setState({
          items: mergedItems,
        });
        return;
      }
      const signaturesMatch = this.signatureOf(nextItems) === this.signatureOf(currentItems);
      if (signaturesMatch) {
        this.setState({
          items: nextItems,
        });
        return;
      }
      const enableTransitions = !!this.props.enableTransitions;
      const previousTopsById = enableTransitions
        ? this.captureItemTopsById(currentItems)
        : {};
      const affectedIds = enableTransitions
        ? new Set(nextItems.map((item, idx) => this.toItemKey(item, idx)))
        : null;
      this.setState({
        items: nextItems,
      }, () => {
        if (enableTransitions) {
          this.applyReorderTransition(previousTopsById, affectedIds);
          return;
        }
        this.notifyReorderComplete();
      });
    }
  }

  handleDragStart(itemId: string | number) {
    this.itemsBeforeDrag = this.toItemList(this.state.items);
    this.draggedItemId = itemId;
    this.pendingReorderCompleteItems = null;
    this.didReorderDuringDrag = false;
    if (this.props.onDragStart) {
      this.props.onDragStart(itemId);
    }
    if (!this.state.isDragging) {
      this.setState({
        isDragging: true,
      });
    }
  }

  handleDragEnd(didDropOnTarget: boolean) {
    if (!this.state.isDragging) {
      this.itemsBeforeDrag = null;
      this.draggedItemId = null;
      if (this.props.onDragEnd) {
        this.props.onDragEnd(didDropOnTarget);
      }
      return;
    }
    const enableTransitions = !!this.props.enableTransitions;
    const restoreOnFailedDrop = !!this.props.restoreOnFailedDrop;
    const onUpdateMode: OnUpdateMode = this.props.onUpdateMode || 'on-drop';
    const shouldRestoreOriginalOrder = restoreOnFailedDrop && !didDropOnTarget && !!this.itemsBeforeDrag;
    const restoredItems = shouldRestoreOriginalOrder ? this.itemsBeforeDrag : null;
    const previousTopsById = enableTransitions && restoredItems
      ? this.captureItemTopsById(this.toItemList(this.state.items))
      : {};
    const affectedIds = enableTransitions && restoredItems
      ? new Set(
        restoredItems
          .map((item, idx) => this.toItemKey(item, idx))
          .filter((itemId) => itemId !== this.draggedItemId),
      )
      : null;
    this.resetReorderTransition();
    const finalize = () => {
      if (this.props.onUpdate && onUpdateMode === 'on-drop' && !restoredItems) {
        this.props.onUpdate(this.toItemList(this.state.items));
      }
      if (this.props.onUpdate && restoredItems) {
        this.props.onUpdate(restoredItems);
      }
      if (!restoredItems && this.didReorderDuringDrag) {
        this.notifyReorderComplete(this.pendingReorderCompleteItems || this.toItemList(this.state.items));
      }
      this.itemsBeforeDrag = null;
      this.draggedItemId = null;
      this.pendingReorderCompleteItems = null;
      this.didReorderDuringDrag = false;
      if (this.props.onDragEnd) {
        this.props.onDragEnd(didDropOnTarget);
      }
    };
    if (restoredItems) {
      this.setState({
        isDragging: false,
        items: restoredItems,
      }, () => {
        if (enableTransitions) {
          this.applyReorderTransition(previousTopsById, affectedIds, restoredItems);
        } else {
          this.notifyReorderComplete(restoredItems);
        }
        finalize();
      });
      return;
    }
    this.setState({
      isDragging: false,
    }, finalize);
  }

  shouldSyncChildrenWhileDragging() {
    return !!this.props.syncChildrenWhileDragging;
  }

  toItemList(children: React.ReactNode): React.ReactElement[] {
    if (Array.isArray(children)) {
      return children.filter((child): child is React.ReactElement =>
        React.isValidElement(child));
    }
    if (React.isValidElement(children)) {
      return [children];
    }
    return [];
  }

  toItemKey(item: React.ReactElement, index: number): string | number {
    const key = item.key;
    if (typeof key === 'number') {
      return key;
    }
    if (typeof key === 'string') {
      return key;
    }
    return index;
  }

  signatureOf(items: React.ReactElement[] = []) {
    return items.map((item, idx) => this.toItemKey(item, idx)).join('|');
  }

  handleItemRef(itemId: string | number, node: HTMLDivElement | null) {
    if (node) {
      this.itemNodesById[itemId] = node;
      return;
    }
    delete this.itemNodesById[itemId];
  }

  captureItemTopsById(items: React.ReactElement[] = []) {
    const topsById: Record<string | number, number> = {};
    items.forEach((item, idx) => {
      const key = this.toItemKey(item, idx);
      const node = this.itemNodesById[key];
      if (!node) {
        return;
      }
      topsById[key] = node.getBoundingClientRect().top;
    });
    return topsById;
  }

  applyReorderTransition(
    previousTopsById: Record<string | number, number> = {},
    affectedIds: Set<string | number> | null = null,
    itemsOnComplete: React.ReactElement[] = this.toItemList(this.state.items),
    shouldNotifyOnComplete: boolean = true,
  ) {
    const nextItems = this.toItemList(this.state.items);
    const nextTopsById = this.captureItemTopsById(nextItems);
    const transformsById: Record<string | number, number> = {};
    nextItems.forEach((item, idx) => {
      const key = this.toItemKey(item, idx);
      if (affectedIds && !affectedIds.has(key)) {
        return;
      }
      const previousTop = previousTopsById[key];
      const nextTop = nextTopsById[key];
      if (typeof previousTop !== 'number' || typeof nextTop !== 'number') {
        return;
      }
      const deltaY = previousTop - nextTop;
      if (Math.abs(deltaY) < 1) {
        return;
      }
      transformsById[key] = deltaY;
    });

    if (Object.keys(transformsById).length < 1) {
      if (shouldNotifyOnComplete) {
        this.notifyReorderComplete(itemsOnComplete);
      }
      return;
    }

    if (this.clearTransitionTimer) {
      window.clearTimeout(this.clearTransitionTimer);
      this.clearTransitionTimer = null;
    }
    this.transitionRunId += 1;
    const transitionRunId = this.transitionRunId;

    this.setState({
      transformsById,
      animateReorder: false,
    }, () => {
      window.requestAnimationFrame(() => {
        if (transitionRunId !== this.transitionRunId) {
          return;
        }
        this.setState({
          transformsById: {},
          animateReorder: true,
        });
        this.clearTransitionTimer = window.setTimeout(() => {
          if (transitionRunId !== this.transitionRunId) {
            return;
          }
          this.setState({
            animateReorder: false,
          });
          this.clearTransitionTimer = null;
          if (shouldNotifyOnComplete) {
            this.notifyReorderComplete(itemsOnComplete);
          }
        }, this.props.transitionDurationMs || REORDER_TRANSITION_MS);
      });
    });
  }

  notifyReorderComplete(items: React.ReactElement[] = this.toItemList(this.state.items)) {
    if (this.props.onReorderComplete) {
      this.props.onReorderComplete(items);
    }
  }

  resetReorderTransition() {
    this.transitionRunId += 1;
    if (this.clearTransitionTimer) {
      window.clearTimeout(this.clearTransitionTimer);
      this.clearTransitionTimer = null;
    }
    this.setState({
      transformsById: {},
      animateReorder: false,
    });
  }

  componentWillUnmount() {
    if (this.clearTransitionTimer) {
      window.clearTimeout(this.clearTransitionTimer);
      this.clearTransitionTimer = null;
    }
  }

  render() {
    const items = this.toItemList(this.state.items);
    const enableTransitions = !!this.props.enableTransitions;
    const dndBackend = this.props.dndBackend || HTML5Backend;
    const listProps = this.props.listProps || {};
    const hoverInsetRatio = typeof this.props.hoverInsetRatio === 'number'
      ? this.props.hoverInsetRatio
      : 0;
    const reorderTrigger: ReorderTrigger = this.props.reorderTrigger || 'midpoint';
    const transitionDurationMs = this.props.transitionDurationMs || REORDER_TRANSITION_MS;
    const transitionEasing = this.props.transitionEasing || 'ease-out';
    const hideDraggedSource = !!this.props.hideDraggedSource;
    const { transformsById, animateReorder } = this.state;
    const ItemComponent = (this.props.itemComponent || ReorderableListItem) as React.ComponentType<
      ReorderableListItemProps & Record<string, any>
    >;
    const itemComponentProps = this.props.itemComponentProps || {};

    return (
      <DndProvider backend={dndBackend} options={this.props.dndBackendOptions}>
        <List
          {...listProps}
          sx={this.props.listSx}
        >
          {items.map((item, i) => {
            const itemKey = this.toItemKey(item, i);
            return (
              <ItemComponent
                key={itemKey}
                handleItemClick={() => this.handleItemClick(itemKey)}
                index={i}
                id={itemKey}
                moveListItem={this.moveListItem}
                onDragStart={this.handleDragStart}
                onDragEnd={this.handleDragEnd}
                offsetY={enableTransitions ? (transformsById[itemKey] || 0) : 0}
                animateReorder={enableTransitions && animateReorder}
                transitionDurationMs={transitionDurationMs}
                transitionEasing={transitionEasing}
                hoverInsetRatio={hoverInsetRatio}
                reorderTrigger={reorderTrigger}
                hideDraggedSource={hideDraggedSource}
                onMeasureRef={this.handleItemRef}
                {...itemComponentProps}
              >
                {item}
              </ItemComponent>
            );
          })}
        </List>
      </DndProvider>
    );
  }
}

export default ReorderableList;
