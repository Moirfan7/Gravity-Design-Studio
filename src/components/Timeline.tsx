import React, { useRef } from 'react';
import { Play, Pause, Square, Repeat, Key } from 'lucide-react';
import type { VectorElement, Keyframe } from '../types/vector';

interface TimelineProps {
  selectedElements: VectorElement[];
  keyframes: Keyframe[];
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isLooping: boolean;
  setIsLooping: (looping: boolean) => void;
  onAddKeyframe: (elementId: string, property: Keyframe['property'], value: any) => void;
  onRemoveKeyframe: (keyframeId: string) => void;
  onApplyPresetAnimation: (elementId: string, preset: 'fade-in' | 'slide-in' | 'spin' | 'pulse' | 'bounce' | 'clear') => void;
}

const TOTAL_FRAMES = 120; // 4 seconds at 30 fps
const FRAME_WIDTH = 8; // pixels per frame for layout rendering

export const Timeline: React.FC<TimelineProps> = ({
  selectedElements,
  keyframes,
  currentFrame,
  setCurrentFrame,
  isPlaying,
  setIsPlaying,
  isLooping,
  setIsLooping,
  onAddKeyframe,
  onRemoveKeyframe,
  onApplyPresetAnimation,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const isSingle = selectedElements.length === 1;
  const element = isSingle ? selectedElements[0] : null;

  // Trackable properties that can be animated
  const animProps: { key: Keyframe['property']; label: string }[] = [
    { key: 'x', label: 'Position X' },
    { key: 'y', label: 'Position Y' },
    { key: 'width', label: 'Width' },
    { key: 'height', label: 'Height' },
    { key: 'rotation', label: 'Rotation' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'fill', label: 'Fill Color' },
  ];

  // Filter keyframes for the active selected element
  const elementKeyframes = element 
    ? keyframes.filter((kf) => kf.elementId === element.id)
    : [];

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frame = Math.max(0, Math.min(TOTAL_FRAMES, Math.round(x / FRAME_WIDTH)));
    setCurrentFrame(frame);
  };

  // Drag scrubber playhead
  const handleScrubberMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const frame = Math.max(0, Math.min(TOTAL_FRAMES, Math.round(x / FRAME_WIDTH)));
      setCurrentFrame(frame);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const toggleKeyframe = (property: Keyframe['property']) => {
    if (!element) return;
    const existing = elementKeyframes.find(
      (kf) => kf.frame === currentFrame && kf.property === property
    );

    if (existing) {
      onRemoveKeyframe(existing.id);
    } else {
      // Capture current value
      let val = (element as any)[property];
      if (val !== undefined) {
        onAddKeyframe(element.id, property, val);
      }
    }
  };

  const getKfAt = (property: Keyframe['property'], frame: number) => {
    return elementKeyframes.find((kf) => kf.property === property && kf.frame === frame);
  };

  return (
    <div className="glass-panel" style={{
      height: 'var(--timeline-height)',
      width: '100%',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 60,
      userSelect: 'none',
      background: 'rgba(10, 11, 15, 0.9)',
    }}>
      {/* Control bar */}
      <div style={{
        height: '38px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-icon-only" 
            style={{ width: '28px', height: '28px' }}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play Animation'}
          >
            {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          </button>
          
          <button 
            className="btn btn-icon-only" 
            style={{ width: '28px', height: '28px' }}
            onClick={() => { setIsPlaying(false); setCurrentFrame(0); }}
            title="Stop / Reset to Start"
          >
            <Square size={13} fill="currentColor" />
          </button>

          <button 
            className="btn btn-icon-only" 
            style={{ 
              width: '28px', 
              height: '28px', 
              background: isLooping ? 'var(--bg-control-active)' : 'transparent',
              borderColor: isLooping ? 'var(--accent)' : 'var(--border-color)'
            }}
            onClick={() => setIsLooping(!isLooping)}
            title="Toggle Loop"
          >
            <Repeat size={13} color={isLooping ? 'var(--accent-cyan)' : 'var(--text-main)'} />
          </button>
          
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px', fontFamily: 'var(--font-mono)' }}>
            30 FPS
          </span>
          
          {/* Quick Animation Presets */}
          {element && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Quick Motion:</span>
              <button className="btn" style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }} onClick={() => onApplyPresetAnimation(element.id, 'fade-in')}>Fade In</button>
              <button className="btn" style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }} onClick={() => onApplyPresetAnimation(element.id, 'slide-in')}>Slide In</button>
              <button className="btn" style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }} onClick={() => onApplyPresetAnimation(element.id, 'spin')}>Spin</button>
              <button className="btn" style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }} onClick={() => onApplyPresetAnimation(element.id, 'pulse')}>Pulse</button>
              <button className="btn" style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }} onClick={() => onApplyPresetAnimation(element.id, 'bounce')}>Bounce</button>
              <button className="btn" style={{ padding: '3px 8px', fontSize: '10px', height: '22px', color: 'var(--accent-danger)' }} onClick={() => onApplyPresetAnimation(element.id, 'clear')}>Clear</button>
            </div>
          )}
        </div>

        {/* Current frame readout */}
        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: '500', color: 'var(--text-muted)' }}>
          Frame <span style={{ color: 'var(--accent-cyan)' }}>{currentFrame}</span> / {TOTAL_FRAMES} ({(currentFrame / 30).toFixed(2)}s)
        </div>
      </div>

      {/* Tracks Area */}
      <div style={{ flex: 1, display: 'flex', overflowY: 'auto' }}>
        
        {/* Left columns: Properties */}
        <div style={{
          width: '180px',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0,0,0,0.1)',
        }}>
          <div style={{ 
            height: '24px', 
            padding: '4px 12px', 
            fontSize: '10px', 
            fontWeight: '600', 
            textTransform: 'uppercase', 
            color: 'var(--text-dim)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center'
          }}>
            Animated Tracks
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!element ? (
              <div style={{ padding: '20px 10px', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
                Select 1 element to animate
              </div>
            ) : (
              animProps.map((p) => {
                const hasKfAtFrame = !!getKfAt(p.key, currentFrame);
                return (
                  <div 
                    key={p.key} 
                    style={{
                      height: '24px',
                      padding: '0 8px 0 12px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{p.label}</span>
                    <button
                      onClick={() => toggleKeyframe(p.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: hasKfAtFrame ? 'var(--accent-secondary)' : 'var(--text-dim)',
                      }}
                      title={hasKfAtFrame ? 'Delete keyframe' : 'Insert keyframe'}
                    >
                      <Key size={11} fill={hasKfAtFrame ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right columns: Ruler & Tracks timeline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'auto', position: 'relative' }}>
          
          {/* Timeline ruler */}
          <div 
            ref={rulerRef}
            onClick={handleRulerClick}
            style={{
              height: '24px',
              borderBottom: '1px solid var(--border-color)',
              position: 'relative',
              cursor: 'ew-resize',
              width: `${(TOTAL_FRAMES + 2) * FRAME_WIDTH}px`,
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {/* Render ticks */}
            {Array.from({ length: TOTAL_FRAMES + 1 }).map((_, frame) => {
              const isMajor = frame % 10 === 0;
              const isMinor = frame % 5 === 0;
              
              if (!isMinor) return null;
              
              return (
                <div 
                  key={frame}
                  style={{
                    position: 'absolute',
                    left: `${frame * FRAME_WIDTH}px`,
                    bottom: 0,
                    width: '1px',
                    height: isMajor ? '12px' : '6px',
                    background: isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  {isMajor && (
                    <span style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '-6px',
                      fontSize: '8px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-dim)',
                    }}>
                      {frame}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Playhead Scrubber line */}
            <div 
              onMouseDown={handleScrubberMouseDown}
              style={{
                position: 'absolute',
                left: `${currentFrame * FRAME_WIDTH}px`,
                top: 0,
                width: '1px',
                height: '500px', // Goes all the way down
                background: 'var(--accent-cyan)',
                zIndex: 10,
                cursor: 'col-resize',
              }}
            >
              {/* Playhead handle */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-5px',
                width: '11px',
                height: '11px',
                background: 'var(--accent-cyan)',
                clipPath: 'polygon(50% 100%, 0 40%, 0 0, 100% 0, 100% 40%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }} />
            </div>
          </div>

          {/* Keyframe rows */}
          <div style={{ flex: 1, position: 'relative', width: `${(TOTAL_FRAMES + 2) * FRAME_WIDTH}px` }}>
            {element && animProps.map((p, rowIdx) => {
              const rowKfs = elementKeyframes.filter((kf) => kf.property === p.key);
              
              return (
                <div 
                  key={p.key} 
                  style={{
                    height: '24px',
                    position: 'relative',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  {/* Keyframe diamonds */}
                  {rowKfs.map((kf) => (
                    <div
                      key={kf.id}
                      onClick={() => onRemoveKeyframe(kf.id)}
                      title={`Frame ${kf.frame}: click to delete`}
                      style={{
                        position: 'absolute',
                        left: `${kf.frame * FRAME_WIDTH}px`,
                        top: '6px',
                        width: '10px',
                        height: '10px',
                        background: 'var(--accent-secondary)',
                        transform: 'translateX(-5px) rotate(45deg)',
                        cursor: 'pointer',
                        border: '1px solid #fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        zIndex: 5,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-cyan)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-secondary)'}
                    />
                  ))}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
export default Timeline;
