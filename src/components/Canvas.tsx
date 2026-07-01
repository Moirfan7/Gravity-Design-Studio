import React, { useRef, useState, useEffect } from 'react';
import type { VectorElement, ToolType, Page, PathPoint } from '../types/vector';
import { getPathD, snap } from '../utils/vectorMath';

interface CanvasProps {
  page: Page;
  elements: VectorElement[];
  selectedIds: string[];
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  onSelectElement: (id: string, isShift: boolean) => void;
  onClearSelection: () => void;
  onAddElement: (el: VectorElement) => void;
  onUpdateElements: (updates: Partial<VectorElement>[], overwrite?: boolean) => void;
  onEraseAction: (deleteIds: string[], addElements: VectorElement[]) => void;
  zoom: number;
  setZoom: (z: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  gridSize: number;
  gridEnabled: boolean;
  marqueeRect: { x: number; y: number; width: number; height: number } | null;
  setMarqueeRect: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  
  // Pencil/Eraser tools
  pencilSize: number;
  pencilColor: string;
  eraserSize: number;
  isLivePresenting: boolean;
  isViewOnly: boolean;
}

export function getStarPoints(cx: number, cy: number, rx: number, ry: number): string {
  const points = [];
  const spikes = 5;
  const outerRadius = rx;
  const innerRadius = rx * 0.4;
  
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes; i++) {
    let px = cx + Math.cos(rot) * outerRadius;
    let py = cy + Math.sin(rot) * ry;
    points.push(`${px},${py}`);
    rot += step;

    px = cx + Math.cos(rot) * innerRadius;
    py = cy + Math.sin(rot) * (innerRadius * (ry / rx));
    points.push(`${px},${py}`);
    rot += step;
  }
  return points.join(' ');
}

export const Canvas: React.FC<CanvasProps> = ({
  page,
  elements,
  selectedIds,
  activeTool,
  setActiveTool,
  onSelectElement,
  onClearSelection,
  onAddElement,
  onUpdateElements,
  onEraseAction,
  zoom,
  setZoom,
  panOffset,
  setPanOffset,
  gridSize,
  gridEnabled,
  marqueeRect,
  setMarqueeRect,
  pencilSize,
  pencilColor,
  eraserSize,
  isLivePresenting,
  isViewOnly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dragging & Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedElementsStart, setDraggedElementsStart] = useState<{ id: string; x: number; y: number; width: number; height: number; rotation: number }[]>([]);
  const [dragAction, setDragAction] = useState<'move' | 'pan' | 'marquee' | 'draw' | 'rotate' | 'resize-n' | 'resize-s' | 'resize-e' | 'resize-w' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'pencil' | 'erase' | null>(null);

  // Pen tool drawing points state
  const [penPoints, setPenPoints] = useState<PathPoint[]>([]);
  const [tempPenPoint, setTempPenPoint] = useState<{ x: number; y: number } | null>(null);
  const [pencilPoints, setPencilPoints] = useState<PathPoint[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [tempDrawShape, setTempDrawShape] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);

  // Live Presentation Mock Cursors State
  const [mockCursors, setMockCursors] = useState<{ id: string; name: string; color: string; x: number; y: number }[]>([]);

  // Keydown / Keyup for spacebar hold
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      );
      if (e.code === 'Space' && !isInput) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mock collaborative cursor movements when Live Presentation is active!
  useEffect(() => {
    if (!isLivePresenting) {
      setMockCursors([]);
      return;
    }
    
    const initialCursors = [
      { id: 'u1', name: 'Alex', color: '#ff7b00', x: 200, y: 150 },
      { id: 'u2', name: 'Mia', color: '#ec4899', x: 550, y: 400 }
    ];
    setMockCursors(initialCursors);

    const interval = setInterval(() => {
      setMockCursors(prev => prev.map(c => {
        const dx = (Math.random() - 0.5) * 80;
        const dy = (Math.random() - 0.5) * 80;
        const nx = Math.max(50, Math.min(page?.width || 800, c.x + dx));
        const ny = Math.max(50, Math.min(page?.height || 600, c.y + dy));
        return { ...c, x: nx, y: ny };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [isLivePresenting, page?.width, page?.height]);

  // Calculate mouse position in canvas coordinates (accounting for zoom & pan)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top - panOffset.y) / zoom;
    return { x, y };
  };

  // Setup global shortcuts for Esc / Enter to complete pen tool drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool === 'pen' && penPoints.length > 0) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          // Finish drawing path
          finishPenPath(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, penPoints]);

  const finishPenPath = (isClosed: boolean) => {
    if (penPoints.length < 2) {
      setPenPoints([]);
      setTempPenPoint(null);
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    penPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const w = Math.max(20, maxX - minX);
    const h = Math.max(20, maxY - minY);

    // Normalize points relative to shape's top-left corner
    const relativePoints = penPoints.map(p => ({
      ...p,
      x: p.x - minX,
      y: p.y - minY
    }));

    const pathElement: VectorElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'path',
      name: `Path ${elements.length + 1}`,
      x: minX,
      y: minY,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      fill: 'none',
      stroke: '#8b5cf6',
      strokeWidth: 2,
      points: relativePoints,
      isClosed
    };

    onAddElement(pathElement);
    setPenPoints([]);
    setTempPenPoint(null);
    setActiveTool('select');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Check if middle click or space key is pressed or H (pan tool) is active
    const isPanMode = activeTool === 'pan' || e.button === 1 || spacePressed;
    const { x: canvasX, y: canvasY } = getCanvasCoords(e.clientX, e.clientY);

    // Snapped coordinates
    const sx = snap(canvasX, gridSize, gridEnabled);
    const sy = snap(canvasY, gridSize, gridEnabled);

    if (isPanMode) {
      setDragAction('pan');
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ ...panOffset });
      setIsDragging(true);
      return;
    }

    if (isViewOnly && activeTool !== 'select') {
      return;
    }

    if (activeTool === 'pencil') {
      const firstPoint: PathPoint = {
        id: Math.random().toString(36).substr(2, 9),
        x: sx,
        y: sy
      };
      setPencilPoints([firstPoint]);
      setDragAction('pencil');
      setIsDragging(true);
      return;
    }

    if (activeTool === 'eraser') {
      setDragAction('erase');
      setIsDragging(true);
      
      const radius = eraserSize / 2;
      const deleteIds: string[] = [];
      const addElements: VectorElement[] = [];

      page?.elements.forEach(el => {
        const elX1 = el.x;
        const elY1 = el.y;
        const elX2 = el.x + el.width;
        const elY2 = el.y + el.height;
        const dx = Math.max(elX1 - sx, 0, sx - elX2);
        const dy = Math.max(elY1 - sy, 0, sy - elY2);
        const dist = Math.hypot(dx, dy);
        
        if (dist > radius) return;

        if (el.type !== 'path' || !el.points || el.points.length === 0) {
          deleteIds.push(el.id);
          return;
        }

        const segments: PathPoint[][] = [];
        let currentSegment: PathPoint[] = [];
        let hasErasedPoint = false;

        el.points.forEach(p => {
          const px = el.x + p.x;
          const py = el.y + p.y;
          const isErased = Math.hypot(px - sx, py - sy) <= radius;
          if (isErased) {
            hasErasedPoint = true;
            if (currentSegment.length > 0) {
              segments.push(currentSegment);
              currentSegment = [];
            }
          } else {
            currentSegment.push(p);
          }
        });

        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }

        if (hasErasedPoint) {
          deleteIds.push(el.id);
          segments.forEach(seg => {
            if (seg.length < 2) return;
            const xs = seg.map(p => el.x + p.x);
            const ys = seg.map(p => el.y + p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const normalized = seg.map(p => ({
              ...p,
              x: (el.x + p.x) - minX,
              y: (el.y + p.y) - minY
            }));

            addElements.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'path',
              name: `${el.name} (Split)`,
              x: minX,
              y: minY,
              width: Math.max(2, maxX - minX),
              height: Math.max(2, maxY - minY),
              rotation: el.rotation,
              opacity: el.opacity,
              fill: el.fill,
              stroke: el.stroke,
              strokeWidth: el.strokeWidth,
              points: normalized,
              isClosed: false
            });
          });
        }
      });

      if (deleteIds.length > 0 || addElements.length > 0) {
        onEraseAction(deleteIds, addElements);
      }
      return;
    }

    if (activeTool === 'pen') {
      const isCloseClick = penPoints.length > 2 && 
        Math.hypot(canvasX - penPoints[0].x, canvasY - penPoints[0].y) < 10;
        
      if (isCloseClick) {
        finishPenPath(true);
      } else {
        const newPoint: PathPoint = {
          id: Math.random().toString(36).substr(2, 9),
          x: sx,
          y: sy
        };
        setPenPoints([...penPoints, newPoint]);
      }
      return;
    }

    if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'line' || activeTool === 'triangle' || activeTool === 'star') {
      setDragAction('draw');
      setDragStart({ x: sx, y: sy });
      setTempDrawShape({ x: sx, y: sy, w: 0, h: 0 });
      setIsDragging(true);
      return;
    }

    if (activeTool === 'text') {
      const textElement: VectorElement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        name: `Text ${elements.length + 1}`,
        x: sx,
        y: sy,
        width: 150,
        height: 40,
        rotation: 0,
        opacity: 1,
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
        text: 'Double click to edit',
        fontSize: 16,
        fontFamily: 'Outfit',
        fontWeight: 'normal',
        textAlign: 'left'
      };
      onAddElement(textElement);
      setActiveTool('select');
      return;
    }

    // Select Tool Selection checks
    if (activeTool === 'select') {
      // Check if we clicked on an element's selection handle
      // This is handled directly by SVG handle components triggering mouse downs. 
      // If we clicked on empty canvas:
      setDragAction('marquee');
      setDragStart({ x: canvasX, y: canvasY });
      setMarqueeRect({ x: canvasX, y: canvasY, width: 0, height: 0 });
      onClearSelection();
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: canvasX, y: canvasY } = getCanvasCoords(e.clientX, e.clientY);
    setMousePos({ x: canvasX, y: canvasY });

    if (activeTool === 'pen') {
      setTempPenPoint({ x: canvasX, y: canvasY });
    }

    if (!isDragging || !dragAction) return;

    if (dragAction === 'pencil') {
      const newPoint: PathPoint = {
        id: Math.random().toString(36).substr(2, 9),
        x: canvasX,
        y: canvasY
      };
      setPencilPoints(prev => [...prev, newPoint]);
      return;
    }

    if (dragAction === 'erase') {
      const radius = eraserSize / 2;
      const deleteIds: string[] = [];
      const addElements: VectorElement[] = [];

      page?.elements.forEach(el => {
        const elX1 = el.x;
        const elY1 = el.y;
        const elX2 = el.x + el.width;
        const elY2 = el.y + el.height;
        const dx = Math.max(elX1 - canvasX, 0, canvasX - elX2);
        const dy = Math.max(elY1 - canvasY, 0, canvasY - elY2);
        const dist = Math.hypot(dx, dy);
        
        if (dist > radius) return;

        if (el.type !== 'path' || !el.points || el.points.length === 0) {
          deleteIds.push(el.id);
          return;
        }

        const segments: PathPoint[][] = [];
        let currentSegment: PathPoint[] = [];
        let hasErasedPoint = false;

        el.points.forEach(p => {
          const px = el.x + p.x;
          const py = el.y + p.y;
          const isErased = Math.hypot(px - canvasX, py - canvasY) <= radius;
          if (isErased) {
            hasErasedPoint = true;
            if (currentSegment.length > 0) {
              segments.push(currentSegment);
              currentSegment = [];
            }
          } else {
            currentSegment.push(p);
          }
        });

        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }

        if (hasErasedPoint) {
          deleteIds.push(el.id);
          segments.forEach(seg => {
            if (seg.length < 2) return;
            const xs = seg.map(p => el.x + p.x);
            const ys = seg.map(p => el.y + p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const normalized = seg.map(p => ({
              ...p,
              x: (el.x + p.x) - minX,
              y: (el.y + p.y) - minY
            }));

            addElements.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'path',
              name: `${el.name} (Split)`,
              x: minX,
              y: minY,
              width: Math.max(2, maxX - minX),
              height: Math.max(2, maxY - minY),
              rotation: el.rotation,
              opacity: el.opacity,
              fill: el.fill,
              stroke: el.stroke,
              strokeWidth: el.strokeWidth,
              points: normalized,
              isClosed: false
            });
          });
        }
      });

      if (deleteIds.length > 0 || addElements.length > 0) {
        onEraseAction(deleteIds, addElements);
      }
      return;
    }

    const sx = snap(canvasX, gridSize, gridEnabled);
    const sy = snap(canvasY, gridSize, gridEnabled);

    if (dragAction === 'pan') {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset({ x: panStart.x + dx, y: panStart.y + dy });
      return;
    }

    if (dragAction === 'marquee') {
      const x1 = Math.min(dragStart.x, canvasX);
      const y1 = Math.min(dragStart.y, canvasY);
      const w = Math.abs(canvasX - dragStart.x);
      const h = Math.abs(canvasY - dragStart.y);
      setMarqueeRect({ x: x1, y: y1, width: w, height: h });
      
      // Select elements inside marquee box
      const hitIds = elements
        .filter((el) => {
          return el.x >= x1 && el.x + el.width <= x1 + w &&
                 el.y >= y1 && el.y + el.height <= y1 + h;
        })
        .map((el) => el.id);
        
      hitIds.forEach((id) => {
        if (!selectedIds.includes(id)) {
          onSelectElement(id, true);
        }
      });
      return;
    }

    if (dragAction === 'draw') {
      const w = sx - dragStart.x;
      const h = sy - dragStart.y;
      setTempDrawShape({
        x: w < 0 ? sx : dragStart.x,
        y: h < 0 ? sy : dragStart.y,
        w: Math.abs(w),
        h: Math.abs(h)
      });
      return;
    }

    // Transform actions (moving, resizing, rotating selected elements)
    if (dragAction === 'move') {
      const dx = sx - dragStart.x;
      const dy = sy - dragStart.y;
      
      const updates = draggedElementsStart.map((start) => ({
        id: start.id,
        x: start.x + dx,
        y: start.y + dy
      }));
      onUpdateElements(updates, true);
      return;
    }

    if (dragAction.startsWith('resize-')) {
      const handleType = dragAction.replace('resize-', '');
      const el = elements.find(item => item.id === selectedIds[0]);
      if (!el) return;
      const start = draggedElementsStart[0];
      
      let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
      const dx = sx - dragStart.x;
      const dy = sy - dragStart.y;

      // Simplistic axis-aligned scaling logic (rotations complicate bounding boxes, 
      // but standard scale coordinates mapping is robust)
      if (handleType.includes('e')) {
        newW = Math.max(10, start.width + dx);
      }
      if (handleType.includes('s')) {
        newH = Math.max(10, start.height + dy);
      }
      if (handleType.includes('w')) {
        const potentialW = start.width - dx;
        if (potentialW > 10) {
          newW = potentialW;
          newX = start.x + dx;
        }
      }
      if (handleType.includes('n')) {
        const potentialH = start.height - dy;
        if (potentialH > 10) {
          newH = potentialH;
          newY = start.y + dy;
        }
      }

      onUpdateElements([{
        id: el.id,
        x: newX,
        y: newY,
        width: newW,
        height: newH
      }], true);
      return;
    }

    if (dragAction === 'rotate') {
      const el = elements.find(item => item.id === selectedIds[0]);
      if (!el) return;
      
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      
      // Calculate angle from center of shape to current mouse position
      const angleRad = Math.atan2(canvasY - cy, canvasX - cx);
      let angleDeg = (angleRad * 180) / Math.PI + 90; // Add 90 offset to align rotation handle upwards
      
      // Snap rotation to 15 degrees if shift key is pressed
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      }
      
      onUpdateElements([{
        id: el.id,
        rotation: (angleDeg + 360) % 360
      }], true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setMarqueeRect(null);
    setTempDrawShape(null);
    
    // Save state snapshot on action completion (Undo checkpoint)
    if (dragAction && dragAction !== 'pan' && dragAction !== 'marquee') {
      // Commit final values into history
      const updates = elements
        .filter((el) => selectedIds.includes(el.id))
        .map((el) => ({ id: el.id })); // Triggers change tracking check in useHistory
      onUpdateElements(updates, false); // Overwrite = false to save state
    }

    // Creating shapes
    if (dragAction === 'draw' && tempDrawShape && tempDrawShape.w > 5 && tempDrawShape.h > 5) {
      const id = Math.random().toString(36).substr(2, 9);
      const newShape: VectorElement = {
        id,
        type: activeTool as 'rectangle' | 'ellipse' | 'line' | 'triangle' | 'star',
        name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${elements.length + 1}`,
        x: tempDrawShape.x,
        y: tempDrawShape.y,
        width: tempDrawShape.w,
        height: tempDrawShape.h,
        rotation: 0,
        opacity: 1,
        fill: '#8b5cf6',
        stroke: 'none',
        strokeWidth: 0
      };
      
      onAddElement(newShape);
      setActiveTool('select');
      onSelectElement(id, false);
    }

    if (dragAction === 'pencil' && pencilPoints.length > 1) {
      const xs = pencilPoints.map(p => p.x);
      const ys = pencilPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const normalizedPoints = pencilPoints.map(p => ({
        ...p,
        x: p.x - minX,
        y: p.y - minY
      }));

      const newId = Math.random().toString(36).substr(2, 9);
      const newPencilShape: VectorElement = {
        id: newId,
        type: 'path',
        name: `Pencil Sketch ${elements.length + 1}`,
        x: minX,
        y: minY,
        width: Math.max(5, maxX - minX),
        height: Math.max(5, maxY - minY),
        rotation: 0,
        opacity: 1,
        fill: 'none',
        stroke: pencilColor,
        strokeWidth: pencilSize,
        points: normalizedPoints,
        isClosed: false
      };
      
      onAddElement(newPencilShape);
      setActiveTool('select');
      onSelectElement(newId, false);
    }
    setPencilPoints([]);

    setDragAction(null);
  };

  // Zoom on scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = 1.1;
      const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      setZoom(Math.max(0.1, Math.min(10, nextZoom)));
    } else {
      // Scroll to Pan
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY
      });
    }
  };

  // Resize / Drag Selection Box setup
  const startTransformDrag = (e: React.MouseEvent, action: typeof dragAction) => {
    if (isViewOnly) return;
    e.stopPropagation();
    e.preventDefault();
    
    const { x: canvasX, y: canvasY } = getCanvasCoords(e.clientX, e.clientY);
    const sx = snap(canvasX, gridSize, gridEnabled);
    const sy = snap(canvasY, gridSize, gridEnabled);

    setDragAction(action);
    setDragStart({ x: sx, y: sy });
    setDraggedElementsStart(
      elements
        .filter((el) => selectedIds.includes(el.id))
        .map((el) => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation }))
    );
    setIsDragging(true);
  };

  // Helper to build gradients defs in the SVG container
  const renderDefs = () => {
    return (
      <defs>
        {/* Draw grids if enabled */}
        {gridEnabled && (
          <pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        )}

        {/* Compile elements' gradients dynamically */}
        {elements.map((el) => {
          if (!el.fillGradient) return null;
          const g = el.fillGradient;
          
          if (g.type === 'linear') {
            const angleRad = (g.angle * Math.PI) / 180;
            const x1 = Math.round(50 - Math.cos(angleRad) * 50) + '%';
            const y1 = Math.round(50 - Math.sin(angleRad) * 50) + '%';
            const x2 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
            const y2 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
            
            return (
              <linearGradient id={`grad-${el.id}`} key={el.id} x1={x1} y1={y1} x2={x2} y2={y2}>
                {g.stops.map((s, idx) => (
                  <stop key={idx} offset={`${s.offset * 100}%`} stopColor={s.color} />
                ))}
              </linearGradient>
            );
          } else {
            return (
              <radialGradient id={`grad-${el.id}`} key={el.id} cx="50%" cy="50%" r="50%">
                {g.stops.map((s, idx) => (
                  <stop key={idx} offset={`${s.offset * 100}%`} stopColor={s.color} />
                ))}
              </radialGradient>
            );
          }
        })}
      </defs>
    );
  };

  // Bounding Selection Box Calculations for single elements
  const singleElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;
  
  return (
    <div 
      className="canvas-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        background: 'var(--bg-main)',
        cursor: spacePressed ? (isDragging ? 'grabbing' : 'grab') : activeTool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : activeTool === 'pencil' ? 'crosshair' : activeTool === 'eraser' ? 'none' : activeTool === 'pen' ? 'crosshair' : 'default',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
      >
        {renderDefs()}

        {/* Global canvas background canvas artboard */}
        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          
          {/* Snap Grid overlay */}
          {gridEnabled && (
            <rect 
              x="0" 
              y="0" 
              width={page.width} 
              height={page.height} 
              fill="url(#grid-pattern)" 
              pointerEvents="none" 
            />
          )}

          {/* Active Artboard shadow layout */}
          <rect
            width={page.width}
            height={page.height}
            fill={page.background}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1 / zoom}
            style={{
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))',
            }}
          />

          {/* Render Elements */}
          {elements.map((el) => {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const shadowStr = el.shadow 
              ? `drop-shadow(${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px rgba(${parseInt(el.shadow.color.slice(1,3),16)}, ${parseInt(el.shadow.color.slice(3,5),16)}, ${parseInt(el.shadow.color.slice(5,7),16)}, ${el.shadow.opacity}))`
              : 'none';

            // Common attributes
            const commonProps = {
              style: {
                transform: `rotate(${el.rotation}deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                filter: shadowStr,
                opacity: el.opacity,
                cursor: activeTool === 'select' ? 'pointer' : 'crosshair'
              },
              fill: el.fillGradient ? `url(#grad-${el.id})` : el.fill,
              stroke: el.stroke,
              strokeWidth: el.strokeWidth,
              onMouseDown: (e: React.MouseEvent) => {
                if (activeTool === 'select') {
                  e.stopPropagation();
                  onSelectElement(el.id, e.shiftKey);
                  if (!isViewOnly) {
                    startTransformDrag(e, 'move');
                  }
                }
              }
            };

            switch (el.type) {
              case 'rectangle':
                return (
                  <rect
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rx={el.cornerRadius || 0}
                    ry={el.cornerRadius || 0}
                    {...commonProps}
                  />
                );
              case 'ellipse':
                return (
                  <ellipse
                    key={el.id}
                    cx={cx}
                    cy={cy}
                    rx={el.width / 2}
                    ry={el.height / 2}
                    {...commonProps}
                  />
                );
              case 'line':
                return (
                  <line
                    key={el.id}
                    x1={el.x}
                    y1={el.y}
                    x2={el.x + el.width}
                    y2={el.y + el.height}
                    {...commonProps}
                  />
                );
              case 'triangle':
                return (
                  <polygon
                    key={el.id}
                    points={`${el.x + el.width/2},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}`}
                    {...commonProps}
                  />
                );
              case 'star':
                return (
                  <polygon
                    key={el.id}
                    points={getStarPoints(cx, cy, el.width/2, el.height/2)}
                    {...commonProps}
                  />
                );
              case 'text':
                return (
                  <text
                    key={el.id}
                    x={el.x}
                    y={el.y + el.height / 1.3} // Visual text vertical adjustment
                    fontSize={el.fontSize || 16}
                    fontWeight={el.fontWeight || 'normal'}
                    textAnchor={el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'}
                    {...commonProps}
                    style={{
                      ...commonProps.style,
                      fontFamily: el.fontFamily || 'Outfit'
                    }}
                  >
                    {el.text}
                  </text>
                );
              case 'path':
                return (
                  <path
                    key={el.id}
                    d={getPathD(el.points || [], el.isClosed || false)}
                    // Translate elements x/y since path values are coordinates normalized relative to x,y
                    {...commonProps}
                    transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width/2}, ${el.height/2})`}
                    style={{
                      ...commonProps.style,
                      transform: 'none', // Overwritten by transform translate
                    }}
                  />
                );
              default:
                return null;
            }
          })}

          {/* Pen tool drawing preview nodes */}
          {activeTool === 'pen' && penPoints.length > 0 && (
            <g>
              <path
                d={getPathD(penPoints, false) + (tempPenPoint ? ` L ${tempPenPoint.x} ${tempPenPoint.y}` : '')}
                className="pen-preview-path"
              />
              {penPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  className={idx === 0 ? "pen-point-selected" : "pen-point"}
                />
              ))}
            </g>
          )}

          {/* Render active temp draw shape */}
          {tempDrawShape && (() => {
            const fill = "rgba(128, 118, 163, 0.25)";
            const stroke = "var(--accent)";
            const strokeWidth = 1.5 / zoom;
            
            if (activeTool === 'rectangle') {
              return (
                <rect
                  x={tempDrawShape.x}
                  y={tempDrawShape.y}
                  width={tempDrawShape.w}
                  height={tempDrawShape.h}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            if (activeTool === 'ellipse') {
              return (
                <ellipse
                  cx={tempDrawShape.x + tempDrawShape.w / 2}
                  cy={tempDrawShape.y + tempDrawShape.h / 2}
                  rx={Math.max(1, tempDrawShape.w / 2)}
                  ry={Math.max(1, tempDrawShape.h / 2)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            if (activeTool === 'triangle') {
              const points = `${tempDrawShape.x + tempDrawShape.w / 2},${tempDrawShape.y} ${tempDrawShape.x + tempDrawShape.w},${tempDrawShape.y + tempDrawShape.h} ${tempDrawShape.x},${tempDrawShape.y + tempDrawShape.h}`;
              return (
                <polygon
                  points={points}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            if (activeTool === 'star') {
              const points = getStarPoints(
                tempDrawShape.x + tempDrawShape.w / 2,
                tempDrawShape.y + tempDrawShape.h / 2,
                Math.max(1, tempDrawShape.w / 2),
                Math.max(1, tempDrawShape.h / 2)
              );
              return (
                <polygon
                  points={points}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            if (activeTool === 'line') {
              return (
                <line
                  x1={tempDrawShape.x}
                  y1={tempDrawShape.y}
                  x2={tempDrawShape.x + tempDrawShape.w}
                  y2={tempDrawShape.y + tempDrawShape.h}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            
            return (
              <rect
                x={tempDrawShape.x}
                y={tempDrawShape.y}
                width={tempDrawShape.w}
                height={tempDrawShape.h}
                fill="rgba(128, 118, 163, 0.15)"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
              />
            );
          })()}

          {/* Selection boxes & Bounding Handles for select mode */}
          {activeTool === 'select' && singleElement && (
            <g 
              style={{
                transformOrigin: `${singleElement.x + singleElement.width/2}px ${singleElement.y + singleElement.height/2}px`,
                transform: `rotate(${singleElement.rotation}deg)`
              }}
            >
              {/* Main Selection Box outline */}
              <rect
                x={singleElement.x}
                y={singleElement.y}
                width={singleElement.width}
                height={singleElement.height}
                className="svg-selection-box"
                strokeWidth={1.5 / zoom}
              />

              {/* 8 Resize Handles */}
              {[
                { type: 'nw', x: singleElement.x, y: singleElement.y, cursor: 'nwse-resize' },
                { type: 'n', x: singleElement.x + singleElement.width/2, y: singleElement.y, cursor: 'ns-resize' },
                { type: 'ne', x: singleElement.x + singleElement.width, y: singleElement.y, cursor: 'nesw-resize' },
                { type: 'e', x: singleElement.x + singleElement.width, y: singleElement.y + singleElement.height/2, cursor: 'ew-resize' },
                { type: 'se', x: singleElement.x + singleElement.width, y: singleElement.y + singleElement.height, cursor: 'nwse-resize' },
                { type: 's', x: singleElement.x + singleElement.width/2, y: singleElement.y + singleElement.height, cursor: 'ns-resize' },
                { type: 'sw', x: singleElement.x, y: singleElement.y + singleElement.height, cursor: 'nesw-resize' },
                { type: 'w', x: singleElement.x, y: singleElement.y + singleElement.height/2, cursor: 'ew-resize' },
              ].map((h) => (
                <rect
                  key={h.type}
                  x={h.x - 4 / zoom}
                  y={h.y - 4 / zoom}
                  width={8 / zoom}
                  height={8 / zoom}
                  className="svg-selection-handle"
                  style={{ cursor: h.cursor }}
                  onMouseDown={(e) => startTransformDrag(e, `resize-${h.type}` as any)}
                />
              ))}

              {/* Rotation Handle & Line connector */}
              <line
                x1={singleElement.x + singleElement.width/2}
                y1={singleElement.y}
                x2={singleElement.x + singleElement.width/2}
                y2={singleElement.y - 20 / zoom}
                className="svg-rotation-line"
                strokeWidth={1 / zoom}
              />
              <circle
                cx={singleElement.x + singleElement.width/2}
                cy={singleElement.y - 20 / zoom}
                r={5 / zoom}
                className="svg-rotation-handle"
                onMouseDown={(e) => startTransformDrag(e, 'rotate')}
              />
            </g>
          )}

          {/* Selection box for multiple shapes */}
          {activeTool === 'select' && selectedIds.length > 1 && (
            (() => {
              // Calculate simple bounding box of selection
              const selectedElements = elements.filter(el => selectedIds.includes(el.id));
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              selectedElements.forEach(el => {
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + el.width);
                maxY = Math.max(maxY, el.y + el.height);
              });
              
              return (
                <rect
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
                  className="svg-selection-box"
                  strokeWidth={1.5 / zoom}
                  strokeDasharray="4 4"
                />
              );
            })()
          )}

          {/* Marquee Select box visual */}
          {marqueeRect && (
            <rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(6, 182, 212, 0.1)"
              stroke="var(--accent-cyan)"
              strokeWidth={1 / zoom}
            />
          )}

          {/* Pencil drawing preview */}
          {pencilPoints.length > 1 && (
            <path
              d={getPathD(pencilPoints, false)}
              fill="none"
              stroke={pencilColor}
              strokeWidth={pencilSize}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Collaborative Live Cursors */}
          {mockCursors.map(c => (
            <g key={c.id} transform={`translate(${c.x}, ${c.y})`} style={{ pointerEvents: 'none', transition: 'transform 0.15s ease' }}>
              <path d="M 0 0 L 0 14 L 3.5 10.5 L 8.5 10.5 Z" fill={c.color} stroke="#ffffff" strokeWidth={1 / zoom} />
              <g transform={`scale(${1 / zoom}) translate(10, 10)`}>
                <rect x={0} y={-10} width={c.name.length * 6 + 10} height={14} rx={3} fill={c.color} />
                <text x={5} y={0} fontSize={8} fill="#ffffff" fontWeight="bold" fontFamily="var(--font-sans)" style={{ userSelect: 'none' }}>
                  {c.name}
                </text>
              </g>
            </g>
          ))}

        </g>
      </svg>

      {/* Screensharing Glow Overlay Frame */}


      {/* Eraser Guide Circle */}
      {activeTool === 'eraser' && mousePos && (
        <div 
          style={{
            position: 'absolute',
            left: `${mousePos.x * zoom + panOffset.x}px`,
            top: `${mousePos.y * zoom + panOffset.y}px`,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000
          }}
        >
          <div 
            style={{
              width: `${eraserSize * zoom}px`,
              height: `${eraserSize * zoom}px`,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1.5px solid #ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
            }}
          />
        </div>
      )}

    </div>
  );
};
export default Canvas;
