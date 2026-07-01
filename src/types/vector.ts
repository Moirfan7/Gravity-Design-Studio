export type ToolType = 'select' | 'pen' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'pan' | 'triangle' | 'star' | 'pencil' | 'eraser';

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientData {
  type: 'linear' | 'radial';
  angle: number; // For linear gradient
  stops: GradientStop[];
}

export interface ShadowData {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface PathPoint {
  id: string;
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface VectorElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'text' | 'path' | 'triangle' | 'star';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  fill: string; // Hex color or 'none' or 'url(#gradient-id)'
  fillGradient?: GradientData;
  stroke: string; // Hex color or 'none'
  strokeWidth: number;
  strokeDasharray?: string;
  shadow?: ShadowData;
  
  // Rectangle specific
  cornerRadius?: number;

  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;

  // Path specific
  points?: PathPoint[];
  isClosed?: boolean;
}

export interface Keyframe {
  id: string;
  elementId: string;
  frame: number; // 0 to 120 (30fps timeline of 4 seconds)
  property: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity' | 'fill' | 'stroke' | 'strokeWidth' | 'cornerRadius';
  value: any; // number, string, etc.
}

export interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  elements: VectorElement[];
}

export interface CommentReply {
  author: string;
  text: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  pageId: string;
  x: number;
  y: number;
  author: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  replies: CommentReply[];
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  active: boolean;
}
