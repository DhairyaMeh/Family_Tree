/**
 * Custom hook for managing pan and zoom transformations.
 * Supports mouse drag, wheel zoom, and pinch-to-zoom gestures.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TransformState } from '../types';

export interface UseTransformReturn {
  transform: TransformState;
  containerRef: React.RefObject<HTMLDivElement>;
  
  // Manual controls
  setTransform: (transform: TransformState) => void;
  pan: (dx: number, dy: number) => void;
  zoom: (delta: number, centerX?: number, centerY?: number) => void;
  reset: () => void;
  centerOn: (x: number, y: number, animate?: boolean) => void;
  
  // State
  isPanning: boolean;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2;
const ZOOM_SENSITIVITY = 0.001;

export function useTransform(
  initialTransform: TransformState = { x: 0, y: 0, scale: 1 }
): UseTransformReturn {
  const [transform, setTransform] = useState<TransformState>(initialTransform);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track drag state
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const lastTransform = useRef<TransformState>(transform);

  /**
   * Pan by a delta amount.
   */
  const pan = useCallback((dx: number, dy: number) => {
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  /**
   * Zoom by a delta, optionally around a center point.
   */
  const zoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setTransform(prev => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta));
      const scaleDiff = newScale - prev.scale;
      
      // If center point provided, zoom around that point
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;
        
        // Calculate offset from center
        const offsetX = centerX - containerCenterX;
        const offsetY = centerY - containerCenterY;
        
        // Adjust translation to zoom around the point
        return {
          x: prev.x - offsetX * scaleDiff / prev.scale,
          y: prev.y - offsetY * scaleDiff / prev.scale,
          scale: newScale,
        };
      }
      
      return { ...prev, scale: newScale };
    });
  }, []);

  /**
   * Reset transform to initial state.
   */
  const reset = useCallback(() => {
    setTransform(initialTransform);
  }, [initialTransform]);

  /**
   * Center the view on a specific point.
   */
  const centerOn = useCallback((x: number, y: number, _animate?: boolean) => {
    setTransform(prev => ({
      ...prev,
      x: -x * prev.scale,
      y: -y * prev.scale,
    }));
  }, []);

  /**
   * Mouse event handlers.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      dragStart.current = { x: e.clientX, y: e.clientY };
      lastTransform.current = transform;
      setIsPanning(true);
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      setTransform({
        ...lastTransform.current,
        x: lastTransform.current.x + dx,
        y: lastTransform.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      dragStart.current = null;
      setIsPanning(false);
      container.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Pinch-to-zoom (trackpad) or scroll wheel
      const delta = -e.deltaY * ZOOM_SENSITIVITY * (e.ctrlKey ? 10 : 1);
      
      const rect = container.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;
      
      zoom(delta, centerX, centerY);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [transform, zoom]);

  return {
    transform,
    containerRef,
    setTransform,
    pan,
    zoom,
    reset,
    centerOn,
    isPanning,
  };
}

