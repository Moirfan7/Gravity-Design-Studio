import type { PathPoint, VectorElement } from '../types/vector';

// Snap value to nearest step
export function snap(val: number, step: number, enabled: boolean): number {
  if (!enabled || step <= 0) return val;
  return Math.round(val / step) * step;
}

// Rotate point (x, y) around center (cx, cy) by angle in degrees
export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const nx = cos * (x - cx) - sin * (y - cy) + cx;
  const ny = sin * (x - cx) + cos * (y - cy) + cy;
  return { x: nx, y: ny };
}

// Generate SVG path string from points array
export function getPathD(points: PathPoint[], isClosed: boolean): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    
    if (i === points.length - 1 && !isClosed) break;
    
    // Determine control points
    const cp1x = current.handleOut ? current.x + current.handleOut.x : current.x;
    const cp1y = current.handleOut ? current.y + current.handleOut.y : current.y;
    const cp2x = next.handleIn ? next.x + next.handleIn.x : next.x;
    const cp2y = next.handleIn ? next.y + next.handleIn.y : next.y;
    
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  
  if (isClosed) {
    d += ' Z';
  }
  
  return d;
}

// Color Interpolation (Hex to RGB and back)
export function lerpColor(color1: string, color2: string, t: number): string {
  if (!color1.startsWith('#') || !color2.startsWith('#')) return color1;
  
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  const rs = r.toString(16).padStart(2, '0');
  const gs = g.toString(16).padStart(2, '0');
  const bs = b.toString(16).padStart(2, '0');
  
  return `#${rs}${gs}${bs}`;
}

// Linearly interpolate numeric properties
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// Helper to interpolate any keyframeable property
export function interpolateProperty(_property: string, val1: any, val2: any, t: number): any {
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return lerp(val1, val2, t);
  }
  
  if (typeof val1 === 'string' && typeof val2 === 'string') {
    if (val1.startsWith('#') && val2.startsWith('#')) {
      return lerpColor(val1, val2, t);
    }
  }
  
  // Return val1 if types mismatch or aren't interpolatable
  return t < 0.5 ? val1 : val2;
}

// Calculate bounding box of multiple selected elements
export function getBoundingBox(elements: VectorElement[]): { x: number; y: number; width: number; height: number } | null {
  if (elements.length === 0) return null;
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  elements.forEach((el) => {
    // For rotated elements, simple bounding box is calculated
    // In a fully featured editor, we compute rotated bounds. 
    // Here we compute the bounds of the element frame, considering center rotation
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    
    const corners = [
      { x: el.x, y: el.y },
      { x: el.x + el.width, y: el.y },
      { x: el.x + el.width, y: el.y + el.height },
      { x: el.x, y: el.y + el.height }
    ];
    
    corners.forEach((p) => {
      const rotated = rotatePoint(p.x, p.y, cx, cy, el.rotation);
      minX = Math.min(minX, rotated.x);
      maxX = Math.max(maxX, rotated.x);
      minY = Math.min(minY, rotated.y);
      maxY = Math.max(maxY, rotated.y);
    });
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
export default { snap, rotatePoint, getPathD, lerpColor, lerp, interpolateProperty, getBoundingBox };
