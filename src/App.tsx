import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline';
import type { Page, VectorElement, Keyframe, ToolType, Comment } from './types/vector';
import { useHistory } from './hooks/useHistory';
import { interpolateProperty } from './utils/vectorMath';

// Initial project layout loaded when Dashboard launches a template
const createDemoElements = (width: number, height: number): VectorElement[] => [
  {
    id: 'el-bg-glow',
    type: 'ellipse',
    name: 'Background Glow',
    x: width / 2 - 150,
    y: height / 2 - 150,
    width: 300,
    height: 300,
    rotation: 0,
    opacity: 0.35,
    fill: 'url(#grad-el-bg-glow)',
    fillGradient: {
      type: 'radial',
      angle: 90,
      stops: [
        { offset: 0, color: '#9bc400' },
        { offset: 1, color: '#ffffff' }
      ]
    },
    stroke: 'none',
    strokeWidth: 0
  },
  {
    id: 'el-rect',
    type: 'rectangle',
    name: 'Core Rectangle',
    x: width / 2 - 60,
    y: height / 2 - 60,
    width: 120,
    height: 120,
    rotation: 45,
    opacity: 1,
    fill: '#8076a3',
    stroke: '#ffffff',
    strokeWidth: 2,
    cornerRadius: 16
  },
  {
    id: 'el-text',
    type: 'text',
    name: 'Logo Text',
    x: width / 2 - 75,
    y: height / 2 + 100,
    width: 150,
    height: 35,
    rotation: 0,
    opacity: 1,
    fill: '#2b242d',
    stroke: 'none',
    strokeWidth: 0,
    text: 'GRAVITY',
    fontSize: 24,
    fontFamily: 'Outfit',
    fontWeight: 'bold',
    textAlign: 'center'
  }
];

// Helper helpers to load initial values from localStorage
const getInitialState = () => {
  const savedState = localStorage.getItem('gravity_project_state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      if (parsed && parsed.pages) return parsed;
    } catch (e) {
      console.error("Error parsing saved state", e);
    }
  }
  return { pages: [], keyframes: [] };
};

const getInitialProjectName = () => {
  return localStorage.getItem('gravity_project_name') || 'Untitled Design';
};

const getInitialActivePageId = () => {
  return localStorage.getItem('gravity_active_page_id') || '';
};

const getInitialShowDashboard = () => {
  const saved = localStorage.getItem('gravity_show_dashboard');
  return saved ? JSON.parse(saved) : true;
};

export const App: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(getInitialShowDashboard);
  const [projectName, setProjectName] = useState(getInitialProjectName);
  
  // Undo/Redo Managed Project State
  const { 
    state: projectState, 
    set: setProjectState, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    reset: resetProjectState
  } = useHistory<{ pages: Page[]; keyframes: Keyframe[] }>(getInitialState());

  const { pages = [], keyframes = [] } = projectState || {};

  // Workspace layout states
  const [loadedFonts, setLoadedFonts] = useState<string[]>(['Outfit', 'sans-serif', 'serif', 'monospace']);
  const [activePageId, setActivePageId] = useState<string>(getInitialActivePageId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Auto-save project state to localStorage on modifications
  useEffect(() => {
    if (pages && pages.length > 0) {
      localStorage.setItem('gravity_project_state', JSON.stringify(projectState));
      localStorage.setItem('gravity_project_name', projectName);
      localStorage.setItem('gravity_active_page_id', activePageId);
      localStorage.setItem('gravity_show_dashboard', JSON.stringify(showDashboard));
    }
  }, [projectState, projectName, activePageId, showDashboard, pages]);

  // Collaboration Suite States
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'mock-c1',
      pageId: 'page-1',
      x: 350,
      y: 200,
      author: 'Alex',
      text: 'Need a softer shadow blur here?',
      timestamp: '10:45 AM',
      resolved: false,
      replies: [
        { author: 'Sarah', text: 'Good catch, adjusted!', timestamp: '10:47 AM' }
      ]
    }
  ]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAccess, setShareAccess] = useState<'view' | 'edit'>('edit');
  const [isLivePresenting, setIsLivePresenting] = useState(false);
  const [inPresentationMode, setInPresentationMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving'>('saved');
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Check URL Query Parameters for shared link on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedProject = params.get('share');
    const sharedMode = params.get('mode') || 'edit';
    const sharedData = params.get('data');
    
    if (sharedProject) {
      setShowDashboard(false);
      const decodedName = decodeURIComponent(sharedProject).toUpperCase().replace(/-/g, ' ');
      setProjectName(decodedName);
      if (sharedMode === 'view') {
        setIsViewOnly(true);
      }

      if (sharedData) {
        try {
          const jsonStr = decodeURIComponent(escape(atob(sharedData)));
          const decoded = JSON.parse(jsonStr);
          if (decoded && decoded.pages && decoded.pages.length > 0) {
            setProjectState({
              pages: decoded.pages,
              keyframes: decoded.keyframes || []
            });
            setActivePageId(decoded.pages[0].id);
          }
        } catch (e) {
          console.error("Failed to decode shared project snapshot data", e);
        }
      }
    }
  }, []);

  const syncTimerRef = useRef<number | null>(null);
  const triggerCloudSync = () => {
    setSyncStatus('saving');
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      setSyncStatus('saved');
    }, 650);
  };

  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 100 });
  const [gridSize, setGridSize] = useState(20);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Animation Timeline state
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const animationRef = useRef<number | null>(null);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Adjust SVG container centering when launching page
  useEffect(() => {
    if (activePage && containerWidth > 0) {
      setPanOffset({
        x: (containerWidth - activePage.width * zoom) / 2,
        y: (containerHeight - activePage.height * zoom) / 2
      });
    }
  }, [showDashboard, activePageId]);

  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth - 540); // Subtract sidebar + inspector widths
      setContainerHeight(window.innerHeight - 272); // Subtract timeline + header heights
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for file imports triggered from components
  useEffect(() => {
    const handleImport = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleImportProject(customEvent.detail.text, customEvent.detail.name);
    };
    window.addEventListener('import-project', handleImport);
    return () => window.removeEventListener('import-project', handleImport);
  }, []);

  // 30 FPS Animation Playback Loop
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const interval = 1000 / 30; // 30 FPS tick

      const tick = (now: number) => {
        const elapsed = now - lastTime;
        if (elapsed >= interval) {
          lastTime = now - (elapsed % interval);
          setCurrentFrame((prevFrame) => {
            if (prevFrame >= 120) {
              if (isLooping) return 0;
              setIsPlaying(false);
              return 120;
            }
            return prevFrame + 1;
          });
        }
        animationRef.current = requestAnimationFrame(tick);
      };
      animationRef.current = requestAnimationFrame(tick);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isLooping]);

  // Spacebar play/pause shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      );
      
      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // ANIMATION VALUE INTERPOLATOR SELECTOR
  const getAnimatedElements = useCallback((elements: VectorElement[], keyframes: Keyframe[], frame: number): VectorElement[] => {
    return elements.map((el) => {
      const elKfs = keyframes.filter((kf) => kf.elementId === el.id);
      if (elKfs.length === 0) return el;

      const animatedEl = { ...el };
      const props = Array.from(new Set(elKfs.map((kf) => kf.property)));
      
      props.forEach((prop) => {
        const propKfs = elKfs.filter((kf) => kf.property === prop).sort((a, b) => a.frame - b.frame);
        if (propKfs.length === 0) return;

        let val: any;
        if (frame <= propKfs[0].frame) {
          val = propKfs[0].value;
        } else if (frame >= propKfs[propKfs.length - 1].frame) {
          val = propKfs[propKfs.length - 1].value;
        } else {
          // Find two keyframes to interpolate
          const nextIdx = propKfs.findIndex((kf) => kf.frame > frame);
          const prevKf = propKfs[nextIdx - 1];
          const nextKf = propKfs[nextIdx];
          const t = (frame - prevKf.frame) / (nextKf.frame - prevKf.frame);
          val = interpolateProperty(prop as string, prevKf.value, nextKf.value, t);
        }
        
        (animatedEl as any)[prop] = val;
      });

      return animatedEl;
    });
  }, []);

  const animatedElements = activePage 
    ? getAnimatedElements(activePage.elements, keyframes, currentFrame)
    : [];

  // Project setup triggers
  const handleCreateProject = (width: number, height: number, name: string) => {
    const defaultPage: Page = {
      id: 'page-1',
      name: 'Page 1',
      width,
      height,
      background: '#fcdad2',
      elements: createDemoElements(width, height)
    };

    setProjectName(name);
    resetProjectState({
      pages: [defaultPage],
      keyframes: [
        // Load default keyframes to showcase animation
        { id: 'kf1', elementId: 'el-rect', frame: 0, property: 'rotation', value: 45 },
        { id: 'kf2', elementId: 'el-rect', frame: 60, property: 'rotation', value: 225 },
        { id: 'kf3', elementId: 'el-rect', frame: 120, property: 'rotation', value: 405 },
        { id: 'kf4', elementId: 'el-text', frame: 0, property: 'opacity', value: 1 },
        { id: 'kf5', elementId: 'el-text', frame: 60, property: 'opacity', value: 0.2 },
        { id: 'kf6', elementId: 'el-text', frame: 120, property: 'opacity', value: 1 },
      ]
    });
    setActivePageId(defaultPage.id);
    setShowDashboard(false);
  };

  const handleImportProject = (text: string, fileName: string) => {
    try {
      if (fileName.endsWith('.svg')) {
        // Simple raw SVG load (creates canvas match size)
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        const w = svg ? parseInt(svg.getAttribute('width') || '800') : 800;
        const h = svg ? parseInt(svg.getAttribute('height') || '600') : 600;
        
        const defaultPage: Page = {
          id: 'page-1',
          name: 'Imported Page',
          width: w,
          height: h,
          background: '#fcdad2',
          elements: []
        };
        
        setProjectName(fileName.replace('.svg', ''));
        resetProjectState({ pages: [defaultPage], keyframes: [] });
        setActivePageId(defaultPage.id);
      } else {
        const data = JSON.parse(text);
        setProjectName(data.projectName || 'Imported Design');
        resetProjectState({
          pages: data.pages || [],
          keyframes: data.keyframes || []
        });
        if (data.pages && data.pages.length > 0) {
          setActivePageId(data.pages[0].id);
        }
      }
      setShowDashboard(false);
    } catch (e) {
      alert('Error parsing vector file: ' + e);
    }
  };

  const handleAddPage = () => {
    const newPage: Page = {
      id: 'page-' + Math.random().toString(36).substr(2, 9),
      name: `Page ${pages.length + 1}`,
      width: activePage?.width || 800,
      height: activePage?.height || 600,
      background: '#0d0f14',
      elements: []
    };

    setProjectState({
      ...projectState,
      pages: [...pages, newPage]
    });
    setActivePageId(newPage.id);
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((p) => p.id !== id);
    setProjectState({
      ...projectState,
      pages: newPages
    });
    if (activePageId === id) {
      setActivePageId(newPages[0].id);
    }
  };

  const handleUpdatePage = (updated: Partial<Page>) => {
    const updatedPages = pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, ...updated };
      }
      return p;
    });
    setProjectState({
      ...projectState,
      pages: updatedPages
    });
    triggerCloudSync();
  };

  const handleAddElement = (el: VectorElement) => {
    const updatedPages = pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: [...p.elements, el] };
      }
      return p;
    });
    setProjectState({
      ...projectState,
      pages: updatedPages
    });
    triggerCloudSync();
  };

  // Commits updates to selected shapes. Automatically handles Auto-Keyframing!
  const handleUpdateElements = (updates: Partial<VectorElement>[], overwrite = false) => {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    
    // Auto-keyframing logic if timeline frame is > 0 and keyframes exist for target property
    const newKeyframes = [...keyframes];

    const updatedPages = pages.map((p) => {
      if (p.id !== activePageId) return p;

      const newElements = p.elements.map((el) => {
        const update = updateMap.get(el.id);
        if (!update) return el;

        const updatedEl = { ...el, ...update };

        // For each updated property, determine if we write a keyframe
        Object.keys(update).forEach((key) => {
          if (key === 'id' || key === 'name' || key === 'type') return;

          const idx = newKeyframes.findIndex(
            (kf) => kf.elementId === el.id && kf.property === key && kf.frame === currentFrame
          );

          if (idx >= 0) {
            newKeyframes[idx] = { ...newKeyframes[idx], value: (update as any)[key] };
          }
        });

        return updatedEl;
      });

      return { ...p, elements: newElements };
    });

    setProjectState({
      pages: updatedPages,
      keyframes: newKeyframes
    }, overwrite);
    triggerCloudSync();
  };

  const handleSelectElement = (id: string, isShift: boolean) => {
    if (isShift) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((sid) => sid !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    // Remove element keyframes
    const newKfs = keyframes.filter((kf) => !selectedIds.includes(kf.elementId));

    const updatedPages = pages.map((p) => {
      if (p.id === activePageId) {
        return {
          ...p,
          elements: p.elements.filter((el) => !selectedIds.includes(el.id))
        };
      }
      return p;
    });

    setProjectState({
      pages: updatedPages,
      keyframes: newKfs
    });
    setSelectedIds([]);
    triggerCloudSync();
  };

  const handleToggleVisibility = (id: string) => {
    const el = activePage.elements.find((e) => e.id === id);
    if (!el) return;
    handleUpdateElements([{
      id,
      opacity: el.opacity === 0 ? 1 : 0
    }]);
  };

  const handleRenameElement = (id: string, newName: string) => {
    handleUpdateElements([{ id, name: newName }]);
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    if (!activePage) return;
    const elements = activePage.elements;
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;

    const newElements = [...elements];
    if (direction === 'up' && index < elements.length - 1) {
      newElements[index] = elements[index + 1];
      newElements[index + 1] = elements[index];
    } else if (direction === 'down' && index > 0) {
      newElements[index] = elements[index - 1];
      newElements[index - 1] = elements[index];
    }

    const updatedPages = pages.map((p) => {
      if (p.id === activePageId) {
        return { ...p, elements: newElements };
      }
      return p;
    });

    setProjectState({
      ...projectState,
      pages: updatedPages
    });
  };

  const handleAddKeyframe = (elementId: string, property: Keyframe['property'], value: any) => {
    const newKf: Keyframe = {
      id: Math.random().toString(36).substr(2, 9),
      elementId,
      frame: currentFrame,
      property,
      value
    };

    setProjectState({
      ...projectState,
      keyframes: [...keyframes, newKf]
    });
  };

  const handleRemoveKeyframe = (keyframeId: string) => {
    setProjectState({
      ...projectState,
      keyframes: keyframes.filter((kf) => kf.id !== keyframeId)
    });
  };

  const handleApplyPresetAnimation = (elementId: string, preset: 'fade-in' | 'slide-in' | 'spin' | 'pulse' | 'bounce' | 'clear') => {
    const el = activePage.elements.find(e => e.id === elementId);
    if (!el) return;

    let filteredKfs = keyframes.filter(kf => kf.elementId !== elementId);
    const generateId = () => Math.random().toString(36).substr(2, 9);

    if (preset === 'spin') {
      filteredKfs.push(
        { id: generateId(), elementId, property: 'rotation', frame: 0, value: el.rotation },
        { id: generateId(), elementId, property: 'rotation', frame: 30, value: (el.rotation + 90) % 360 },
        { id: generateId(), elementId, property: 'rotation', frame: 60, value: (el.rotation + 180) % 360 },
        { id: generateId(), elementId, property: 'rotation', frame: 90, value: (el.rotation + 270) % 360 },
        { id: generateId(), elementId, property: 'rotation', frame: 120, value: (el.rotation + 360) % 360 }
      );
    } else if (preset === 'pulse') {
      filteredKfs.push(
        { id: generateId(), elementId, property: 'opacity', frame: 0, value: 1 },
        { id: generateId(), elementId, property: 'opacity', frame: 30, value: 0.3 },
        { id: generateId(), elementId, property: 'opacity', frame: 60, value: 1 },
        { id: generateId(), elementId, property: 'opacity', frame: 90, value: 0.3 },
        { id: generateId(), elementId, property: 'opacity', frame: 120, value: 1 }
      );
    } else if (preset === 'bounce') {
      const baseVal = el.y;
      filteredKfs.push(
        { id: generateId(), elementId, property: 'y', frame: 0, value: baseVal },
        { id: generateId(), elementId, property: 'y', frame: 30, value: baseVal - 50 },
        { id: generateId(), elementId, property: 'y', frame: 60, value: baseVal },
        { id: generateId(), elementId, property: 'y', frame: 90, value: baseVal - 50 },
        { id: generateId(), elementId, property: 'y', frame: 120, value: baseVal }
      );
    } else if (preset === 'fade-in') {
      filteredKfs.push(
        { id: generateId(), elementId, property: 'opacity', frame: 0, value: 0 },
        { id: generateId(), elementId, property: 'opacity', frame: 40, value: 1 }
      );
    } else if (preset === 'slide-in') {
      const baseVal = el.x;
      filteredKfs.push(
        { id: generateId(), elementId, property: 'x', frame: 0, value: baseVal - 150 },
        { id: generateId(), elementId, property: 'x', frame: 40, value: baseVal }
      );
    }

    setProjectState({
      ...projectState,
      keyframes: filteredKfs
    });
    triggerCloudSync();
  };

  const handleGroup = () => {
    // Standard group combines elements or assigns them a tag
    // For simplicity, we keep selection group bounds
  };

  const handleUngroup = () => {
    // Remove group mapping
  };

  const handleBooleanOp = (_op: 'union' | 'subtract' | 'intersect' | 'exclude') => {
    // Generate boolean shapes (composite paths)
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.length <= 1) return;
    const selectedElements = activePage.elements.filter((el) => selectedIds.includes(el.id));
    
    // Bounds calculations
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    selectedElements.forEach((el) => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const updates = selectedElements.map((el) => {
      let targetX = el.x;
      let targetY = el.y;

      if (type === 'left') targetX = minX;
      if (type === 'right') targetX = maxX - el.width;
      if (type === 'center') targetX = midX - el.width / 2;
      if (type === 'top') targetY = minY;
      if (type === 'bottom') targetY = maxY - el.height;
      if (type === 'middle') targetY = midY - el.height / 2;

      return { id: el.id, x: targetX, y: targetY };
    });

    handleUpdateElements(updates);
  };

  // EXPORT UTILITIES
  const handleSave = () => {
    const data = JSON.stringify({ projectName, pages, keyframes }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.gravity`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSVG = () => {
    // Compile vector elements to an clean SVG XML code block
    let defsStr = '';
    
    // Compile gradients inside defs
    activePage.elements.forEach((el) => {
      if (!el.fillGradient) return;
      const g = el.fillGradient;
      const stops = g.stops.map((s: any) => `<stop offset="${s.offset*100}%" stop-color="${s.color}" />`).join('');
      if (g.type === 'linear') {
        const rad = (g.angle * Math.PI) / 180;
        const x1 = Math.round(50 - Math.cos(rad) * 50) + '%';
        const y1 = Math.round(50 - Math.sin(rad) * 50) + '%';
        const x2 = Math.round(50 + Math.cos(rad) * 50) + '%';
        const y2 = Math.round(50 + Math.sin(rad) * 50) + '%';
        defsStr += `<linearGradient id="grad-${el.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`;
      } else {
        defsStr += `<radialGradient id="grad-${el.id}" cx="50%" cy="50%" r="50%">${stops}</radialGradient>`;
      }
    });

    let shapesStr = '';
    animatedElements.forEach((el) => {
      const fillStr = el.fillGradient ? `url(#grad-${el.id})` : el.fill;
      const rotOrigin = `${el.x + el.width/2} ${el.y + el.height/2}`;
      const transformStr = el.rotation !== 0 ? `transform="rotate(${el.rotation} ${rotOrigin})"` : '';
      const shadowStyle = el.shadow ? `style="filter: drop-shadow(${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px rgba(0,0,0,${el.shadow.opacity}))"` : '';
      
      if (el.type === 'rectangle') {
        shapesStr += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.cornerRadius || 0}" ry="${el.cornerRadius || 0}" fill="${fillStr}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" ${transformStr} ${shadowStyle} />`;
      } else if (el.type === 'ellipse') {
        shapesStr += `<ellipse cx="${el.x + el.width/2}" cy="${el.y + el.height/2}" rx="${el.width/2}" ry="${el.height/2}" fill="${fillStr}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" ${transformStr} ${shadowStyle} />`;
      } else if (el.type === 'triangle') {
        shapesStr += `<polygon points="${el.x + el.width/2},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}" fill="${fillStr}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" ${transformStr} ${shadowStyle} />`;
      } else if (el.type === 'star') {
        const points = [];
        const spikes = 5;
        const cx = el.x + el.width/2;
        const cy = el.y + el.height/2;
        const rx = el.width/2;
        const ry = el.height/2;
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
        shapesStr += `<polygon points="${points.join(' ')}" fill="${fillStr}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" ${transformStr} ${shadowStyle} />`;
      } else if (el.type === 'line') {
        shapesStr += `<line x1="${el.x}" y1="${el.y}" x2="${el.x+el.width}" y2="${el.y+el.height}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" ${transformStr} ${shadowStyle} />`;
      } else if (el.type === 'text') {
        shapesStr += `<text x="${el.x}" y="${el.y + el.height/1.3}" font-size="${el.fontSize}" font-family="${el.fontFamily}" fill="${fillStr}" opacity="${el.opacity}" ${transformStr} ${shadowStyle}>${el.text}</text>`;
      }
    });

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${activePage.width}" height="${activePage.height}" viewBox="0 0 ${activePage.width} ${activePage.height}"><defs>${defsStr}</defs>${shapesStr}</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    // Convert current SVG canvas image to HTML5 canvas and export
    const canvas = document.createElement('canvas');
    canvas.width = activePage.width;
    canvas.height = activePage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = activePage.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simple representations of elements for raw image export
    animatedElements.forEach((el) => {
      ctx.save();
      ctx.globalAlpha = el.opacity;
      
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      
      // Handle rotation
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      ctx.fillStyle = el.fill.startsWith('#') ? el.fill : '#8b5cf6';
      ctx.strokeStyle = el.stroke.startsWith('#') ? el.stroke : 'transparent';
      ctx.lineWidth = el.strokeWidth;

      if (el.type === 'rectangle') {
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.strokeWidth > 0) ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(cx, cy, el.width/2, el.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (el.strokeWidth > 0) ctx.stroke();
      } else if (el.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(el.x + el.width/2, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.lineTo(el.x, el.y + el.height);
        ctx.closePath();
        ctx.fill();
        if (el.strokeWidth > 0) ctx.stroke();
      } else if (el.type === 'star') {
        const spikes = 5;
        const rx = el.width/2;
        const ry = el.height/2;
        const outerRadius = rx;
        const innerRadius = rx * 0.4;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
          let px = cx + Math.cos(rot) * outerRadius;
          let py = cy + Math.sin(rot) * ry;
          ctx.lineTo(px, py);
          rot += step;
          px = cx + Math.cos(rot) * innerRadius;
          py = cy + Math.sin(rot) * (innerRadius * (ry / rx));
          ctx.lineTo(px, py);
          rot += step;
        }
        ctx.closePath();
        ctx.fill();
        if (el.strokeWidth > 0) ctx.stroke();
      } else if (el.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
        ctx.textAlign = el.textAlign || 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.text || '', el.x, cy);
      }
      ctx.restore();
    });

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.png`;
    a.click();
  };

  const handleExportCSS = () => {
    // Generate keyframe CSS declarations for web deployment
    let cssCode = `/* CSS Keyframe Animations for ${projectName} */\n\n`;
    
    // Group keyframes by element
    const elIds = Array.from(new Set(keyframes.map(kf => kf.elementId)));
    
    elIds.forEach((elId) => {
      const el = activePage.elements.find(e => e.id === elId);
      if (!el) return;
      
      const elKfs = keyframes.filter(kf => kf.elementId === elId);
      
      cssCode += `@keyframes anim-${elId} {\n`;
      
      // Track values at key ticks: 0%, 25%, 50%, 75%, 100% (or specific frame conversion)
      // Since our timeline has 120 frames, we translate frame number to percentage: % = (frame / 120) * 100
      const framesList = Array.from(new Set(elKfs.map(kf => kf.frame))).sort((a,b) => a - b);
      
      framesList.forEach((frame) => {
        const pct = ((frame / 120) * 100).toFixed(1);
        const frameElements = getAnimatedElements([el], keyframes, frame);
        const animatedEl = frameElements[0];
        
        cssCode += `  ${pct}% {\n`;
        cssCode += `    transform: translate(${Math.round(animatedEl.x)}px, ${Math.round(animatedEl.y)}px) rotate(${Math.round(animatedEl.rotation)}deg);\n`;
        cssCode += `    opacity: ${animatedEl.opacity};\n`;
        if (animatedEl.fill.startsWith('#')) {
          cssCode += `    fill: ${animatedEl.fill};\n`;
        }
        cssCode += `  }\n`;
      });
      
      cssCode += `}\n\n`;
      cssCode += `#${elId} {\n`;
      cssCode += `  animation: anim-${elId} 4s infinite ease-in-out;\n`;
      cssCode += `}\n\n`;
    });

    const blob = new Blob([cssCode], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_keyframes.css`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (inPresentationMode) {
    return (
      <div className="app-container" style={{ background: 'var(--bg-main)', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <Canvas 
          page={activePage}
          elements={animatedElements}
          selectedIds={selectedIds}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onSelectElement={handleSelectElement}
          onClearSelection={() => setSelectedIds([])}
          onAddElement={handleAddElement}
          onUpdateElements={handleUpdateElements}
          zoom={zoom}
          setZoom={setZoom}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          gridSize={gridSize}
          gridEnabled={false}
          marqueeRect={null}
          setMarqueeRect={() => {}}
          comments={comments}
          setComments={setComments}
          isLivePresenting={isLivePresenting}
          isViewOnly={isViewOnly}
        />
        
        {/* Presentation bottom controller */}
        <div 
          className="glass-panel" 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            borderRadius: '24px',
            boxShadow: 'var(--glass-shadow)',
            zIndex: 1000,
            background: 'var(--bg-panel-solid)',
            border: '1px solid var(--border-color)'
          }}
        >
          <button 
            className="btn" 
            onClick={() => {
              const idx = pages.findIndex(p => p.id === activePageId);
              if (idx > 0) setActivePageId(pages[idx - 1].id);
            }}
            disabled={pages.findIndex(p => p.id === activePageId) === 0}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            Prev Scene
          </button>
          
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
            Scene {pages.findIndex(p => p.id === activePageId) + 1} / {pages.length}
          </span>
          
          <button 
            className="btn" 
            onClick={() => {
              const idx = pages.findIndex(p => p.id === activePageId);
              if (idx < pages.length - 1) setActivePageId(pages[idx + 1].id);
            }}
            disabled={pages.findIndex(p => p.id === activePageId) === pages.length - 1}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            Next Scene
          </button>

          <div style={{ height: '16px', width: '1px', background: 'var(--border-color)' }} />
          
          <button 
            className="btn" 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div style={{ height: '16px', width: '1px', background: 'var(--border-color)' }} />

          {/* Go Live Toggle */}
          <button 
            className="btn" 
            onClick={() => setIsLivePresenting(!isLivePresenting)}
            style={{ 
              padding: '4px 10px', 
              fontSize: '12px',
              background: isLivePresenting ? 'rgba(155, 196, 0, 0.15)' : 'transparent',
              borderColor: isLivePresenting ? '#9bc400' : 'var(--border-color)',
              color: isLivePresenting ? '#9bc400' : 'var(--text-main)',
            }}
          >
            📡 {isLivePresenting ? 'Live Cursors Active' : 'Present Live'}
          </button>

          <div style={{ height: '16px', width: '1px', background: 'var(--border-color)' }} />

          <button 
            className="btn btn-primary" 
            onClick={() => {
              setInPresentationMode(false);
              setIsLivePresenting(false);
            }}
            style={{ padding: '4px 12px', fontSize: '12px' }}
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {showDashboard ? (
        <Dashboard 
          onCreateProject={handleCreateProject}
          onImportProject={handleImportProject}
        />
      ) : (
        <>
          {/* View-Only Mode Banner */}
          {isViewOnly && (
            <div style={{
              background: '#8076a3',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 10000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <span>👁️ View-Only Mode: You are viewing a shared design workspace. (Contact owner for edit access)</span>
            </div>
          )}
          <Toolbar 
            projectName={projectName}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onDeleteSelected={handleDeleteSelected}
            onGroup={handleGroup}
            onUngroup={handleUngroup}
            onBooleanOp={handleBooleanOp}
            selectedCount={selectedIds.length}
            zoom={zoom}
            setZoom={setZoom}
            onSave={handleSave}
            onExportSVG={handleExportSVG}
            onExportPNG={handleExportPNG}
            onExportCSS={handleExportCSS}
            onNew={() => setShowDashboard(true)}
            syncStatus={syncStatus}
            setShowShareModal={setShowShareModal}
            setInPresentationMode={setInPresentationMode}
            isViewOnly={isViewOnly}
          />

          <div className="workspace-layout">
            <div style={{ pointerEvents: isViewOnly ? 'none' : 'auto', opacity: isViewOnly ? 0.75 : 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Sidebar 
                pages={pages}
                activePageId={activePageId}
                setActivePageId={setActivePageId}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                elements={activePage?.elements || []}
                selectedIds={selectedIds}
                onSelectElement={handleSelectElement}
                onToggleVisibility={handleToggleVisibility}
                onRenameElement={handleRenameElement}
                onMoveLayer={handleMoveLayer}
              />
            </div>

            <div className="center-area">
              <Canvas 
                page={activePage}
                elements={animatedElements}
                selectedIds={selectedIds}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                onSelectElement={handleSelectElement}
                onClearSelection={() => setSelectedIds([])}
                onAddElement={handleAddElement}
                onUpdateElements={handleUpdateElements}
                zoom={zoom}
                setZoom={setZoom}
                panOffset={panOffset}
                setPanOffset={setPanOffset}
                gridSize={gridSize}
                gridEnabled={gridEnabled}
                marqueeRect={marqueeRect}
                setMarqueeRect={setMarqueeRect}
                comments={comments}
                setComments={setComments}
                isLivePresenting={isLivePresenting}
                isViewOnly={isViewOnly}
              />

              <div style={{ pointerEvents: isViewOnly ? 'none' : 'auto', opacity: isViewOnly ? 0.75 : 1, width: '100%' }}>
                <Timeline 
                  selectedElements={activePage?.elements.filter(el => selectedIds.includes(el.id)) || []}
                  keyframes={keyframes}
                  currentFrame={currentFrame}
                  setCurrentFrame={setCurrentFrame}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  isLooping={isLooping}
                  setIsLooping={setIsLooping}
                  onAddKeyframe={handleAddKeyframe}
                  onRemoveKeyframe={handleRemoveKeyframe}
                  onApplyPresetAnimation={handleApplyPresetAnimation}
                />
              </div>
            </div>

            <div style={{ pointerEvents: isViewOnly ? 'none' : 'auto', opacity: isViewOnly ? 0.75 : 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Inspector 
                selectedElements={activePage?.elements.filter(el => selectedIds.includes(el.id)) || []}
                onUpdateElements={handleUpdateElements}
                page={activePage}
                onUpdatePage={handleUpdatePage}
                gridSize={gridSize}
                setGridSize={setGridSize}
                gridEnabled={gridEnabled}
                setGridEnabled={setGridEnabled}
                onAlign={handleAlign}
                loadedFonts={loadedFonts}
                onLoadFont={(font) => {
                  if (!loadedFonts.includes(font)) {
                    setLoadedFonts([...loadedFonts, font]);
                  }
                }}
              />
            </div>
          </div>
        </>
      )}



      {/* Share Link Access Control Modal */}
      {showShareModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 21, 28, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '380px',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: 'var(--glass-shadow)',
              background: 'var(--bg-panel-solid)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>Invite Collaborators</span>
              <button 
                className="btn" 
                onClick={() => setShowShareModal(false)}
                style={{ border: 'none', background: 'transparent', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Link Access Authority</label>
              <select 
                value={shareAccess} 
                onChange={(e) => setShareAccess(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="edit">Anyone with link can Edit (Full Access)</option>
                <option value="view">Anyone with link can View (View-only)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Collaborator Invite Link</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.href.split('?')[0].replace(/\/$/, '')}/?share=${encodeURIComponent(projectName.toLowerCase().replace(/\s+/g, '-'))}&mode=${shareAccess}&data=${btoa(unescape(encodeURIComponent(JSON.stringify({ pages, keyframes }))))}`}
                  style={{ flex: 1, fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    const base = window.location.href.split('?')[0].replace(/\/$/, '');
                    const base64Str = btoa(unescape(encodeURIComponent(JSON.stringify({ pages, keyframes }))));
                    const link = `${base}/?share=${encodeURIComponent(projectName.toLowerCase().replace(/\s+/g, '-'))}&mode=${shareAccess}&data=${base64Str}`;
                    navigator.clipboard.writeText(link);
                    alert("Invitation Link copied to clipboard!");
                  }}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>ONLINE COLLABORATORS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#8076a3', color: '#fff', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>S</div>
                    <span>Sarah (You)</span>
                  </div>
                  <span style={{ color: 'var(--accent-success)', fontSize: '10px' }}>Owner</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ff7b00', color: '#fff', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
                    <span>Alex</span>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Editing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
