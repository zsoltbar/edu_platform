// Virtual scrolling component for large datasets

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface VirtualListProps<T = any> {
  items: T[];
  height: number; // Container height
  itemHeight: number | ((index: number) => number); // Fixed height or function for dynamic height
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Number of items to render outside visible area
  className?: string;
  onScroll?: (scrollTop: number) => void;
  estimatedItemHeight?: number; // Used for dynamic heights
}

export const VirtualList = <T extends any>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  estimatedItemHeight = 50
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  // Memoize item heights for performance
  const itemHeights = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return new Array(items.length).fill(itemHeight);
    }
    
    // For dynamic heights, calculate or estimate
    return items.map((_, index) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index);
      }
      return estimatedItemHeight;
    });
  }, [items.length, itemHeight, estimatedItemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return itemHeights.reduce((sum, height) => sum + height, 0);
  }, [itemHeights]);

  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    let accumulatedHeight = 0;
    let start = 0;
    let offsetY = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights[i];
      if (accumulatedHeight + itemHeight > scrollTop) {
        start = i;
        offsetY = accumulatedHeight;
        break;
      }
      accumulatedHeight += itemHeight;
    }

    // Find end index
    let end = start;
    let visibleHeight = 0;
    for (let i = start; i < items.length; i++) {
      visibleHeight += itemHeights[i];
      if (visibleHeight >= height) {
        end = i;
        break;
      }
      end = i;
    }

    // Apply overscan
    const startWithOverscan = Math.max(0, start - overscan);
    const endWithOverscan = Math.min(items.length - 1, end + overscan);

    // Adjust offset for overscan
    let adjustedOffsetY = offsetY;
    for (let i = startWithOverscan; i < start; i++) {
      adjustedOffsetY -= itemHeights[i];
    }

    return {
      startIndex: startWithOverscan,
      endIndex: endWithOverscan,
      offsetY: adjustedOffsetY
    };
  }, [scrollTop, height, itemHeights, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollElementRef.current) return;
    
    let targetScrollTop = 0;
    for (let i = 0; i < index; i++) {
      targetScrollTop += itemHeights[i];
    }
    
    scrollElementRef.current.scrollTop = targetScrollTop;
  }, [itemHeights]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                style={{ height: itemHeights[actualIndex] }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Hook for virtual scrolling
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number | ((index: number) => number),
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    if (typeof itemHeight === 'number') {
      // Fixed height calculation
      const start = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(itemCount - 1, start + visibleCount);

      return {
        startIndex: Math.max(0, start - overscan),
        endIndex: Math.min(itemCount - 1, end + overscan),
        totalHeight: itemCount * itemHeight
      };
    } else {
      // Dynamic height calculation (simplified)
      // In a real implementation, you'd cache calculated heights
      let accumulatedHeight = 0;
      let start = 0;
      let end = 0;

      // Find start index
      for (let i = 0; i < itemCount; i++) {
        const height = itemHeight(i);
        if (accumulatedHeight + height > scrollTop) {
          start = i;
          break;
        }
        accumulatedHeight += height;
      }

      // Find end index
      let visibleHeight = 0;
      for (let i = start; i < itemCount; i++) {
        const height = itemHeight(i);
        visibleHeight += height;
        if (visibleHeight >= containerHeight) {
          end = i;
          break;
        }
        end = i;
      }

      // Calculate total height
      let total = 0;
      for (let i = 0; i < itemCount; i++) {
        total += itemHeight(i);
      }

      return {
        startIndex: Math.max(0, start - overscan),
        endIndex: Math.min(itemCount - 1, end + overscan),
        totalHeight: total
      };
    }
  }, [scrollTop, itemHeight, itemCount, containerHeight, overscan]);

  return {
    startIndex,
    endIndex,
    totalHeight,
    scrollTop,
    setScrollTop
  };
};

// Virtual grid component for 2D virtualization
export interface VirtualGridProps<T = any> {
  items: T[];
  height: number;
  width: number;
  itemHeight: number;
  itemWidth: number;
  columnsCount: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

export const VirtualGrid = <T extends any>({
  items,
  height,
  width,
  itemHeight,
  itemWidth,
  columnsCount,
  renderItem,
  gap = 0,
  className = ''
}: VirtualGridProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(items.length / columnsCount);
  const totalHeight = rowCount * (itemHeight + gap) - gap;

  const { startRowIndex, endRowIndex } = useMemo(() => {
    const rowHeight = itemHeight + gap;
    const start = Math.floor(scrollTop / rowHeight);
    const visibleRowCount = Math.ceil(height / rowHeight);
    const end = Math.min(rowCount - 1, start + visibleRowCount);

    return {
      startRowIndex: Math.max(0, start - 2), // Small overscan for grid
      endRowIndex: Math.min(rowCount - 1, end + 2)
    };
  }, [scrollTop, itemHeight, gap, height, rowCount]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRows: Array<Array<{
    item: T;
    rowIndex: number;
    columnIndex: number;
    itemIndex: number;
  }>> = [];
  
  for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
    const row: Array<{
      item: T;
      rowIndex: number;
      columnIndex: number;
      itemIndex: number;
    }> = [];
    
    for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
      const itemIndex = rowIndex * columnsCount + columnIndex;
      if (itemIndex < items.length) {
        row.push({
          item: items[itemIndex],
          rowIndex,
          columnIndex,
          itemIndex
        });
      }
    }
    
    if (row.length > 0) {
      visibleRows.push(row);
    }
  }

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startRowIndex * (itemHeight + gap)}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleRows.map((row, rowIndex) => (
            <div
              key={startRowIndex + rowIndex}
              style={{
                display: 'flex',
                height: itemHeight,
                marginBottom: gap,
                gap: gap
              }}
            >
              {row.map(({ item, rowIndex, columnIndex, itemIndex }) => (
                <div
                  key={itemIndex}
                  style={{ width: itemWidth, height: itemHeight }}
                >
                  {renderItem(item, rowIndex, columnIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};