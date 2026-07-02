import React, { useState } from 'react';
import { 
  Pointer, Square, Circle, Type, Save, 
  Undo2, Redo2, Trash2, Group, Ungroup, ChevronDown, 
  Minimize, Plus, FileCode, Combine, Triangle, Star,
  Share2, Play, Cloud, Home, Pencil, Eraser
} from 'lucide-react';
import type { ToolType } from '../types/vector';

interface ToolbarProps {
  projectName: string;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBooleanOp: (op: 'union' | 'subtract' | 'intersect' | 'exclude') => void;
  selectedCount: number;
  zoom: number;
  setZoom: (z: number) => void;
  onSave: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportCSS: () => void;
  onNew: () => void;
  
  // Collaborative addition props
  syncStatus: 'saved' | 'saving';
  setShowShareModal: (val: boolean) => void;
  setInPresentationMode: (val: boolean) => void;
  isViewOnly: boolean;
  pencilSize: number;
  setPencilSize: (val: number) => void;
  pencilColor: string;
  setPencilColor: (val: string) => void;
  eraserSize: number;
  setEraserSize: (val: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectName,
  activeTool,
  setActiveTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDeleteSelected,
  onGroup,
  onUngroup,
  onBooleanOp,
  selectedCount,
  zoom,
  setZoom,
  onSave,
  onExportSVG,
  onExportPNG,
  onExportCSS,
  onNew,
  syncStatus,
  setShowShareModal,
  setInPresentationMode,
  isViewOnly,
  pencilSize,
  setPencilSize,
  pencilColor,
  setPencilColor,
  eraserSize,
  setEraserSize,
}) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const tools = [
    { type: 'select' as ToolType, label: 'Select (V)', icon: Pointer },
    { type: 'pen' as ToolType, label: 'Pen Tool (P)', icon: FileCode },
    { type: 'pencil' as ToolType, label: 'Pencil (N)', icon: Pencil },
    { type: 'eraser' as ToolType, label: 'Eraser (E)', icon: Eraser },
    { type: 'rectangle' as ToolType, label: 'Rectangle (R)', icon: Square },
    { type: 'ellipse' as ToolType, label: 'Ellipse (O)', icon: Circle },
    { type: 'triangle' as ToolType, label: 'Triangle (T)', icon: Triangle },
    { type: 'star' as ToolType, label: 'Star (S)', icon: Star },
    { type: 'line' as ToolType, label: 'Line (L)', icon: Minimize },
    { type: 'text' as ToolType, label: 'Text Tool (T)', icon: Type },
  ];

  return (
    <header className="glass-panel" style={{
      height: 'var(--header-height)',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)',
      position: 'relative'
    }}>
      {/* Centered App Brand Title */}
      <div 
        onClick={onNew}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '15px',
          fontWeight: '800',
          cursor: 'pointer',
          letterSpacing: '1px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          zIndex: 10,
          fontFamily: 'var(--font-sans)'
        }}
      >
        GRAVITY DESIGN STUDIO
      </div>

      {/* Left section: Logo & File Options */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn" 
            onClick={onNew} 
            title="Dashboard Access"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Home size={16} />
          </button>
          <div 
            style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: 'var(--text-main)',
              marginLeft: '4px',
              fontFamily: 'var(--font-sans)',
              opacity: 0.8
            }}
          >
            {projectName}
          </div>
          
          {/* Cloud Sync Status Indicator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '11px', 
              color: syncStatus === 'saving' ? 'var(--accent)' : 'var(--accent-cyan)',
              marginLeft: '8px',
              padding: '2px 8px',
              background: 'var(--bg-control)',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
            title={syncStatus === 'saving' ? 'Saving changes to cloud...' : 'All changes saved to cloud'}
          >
            <Cloud size={11} className={syncStatus === 'saving' ? 'pulse-anim' : ''} />
            <span style={{ fontSize: '10px', fontWeight: '500' }}>
              {syncStatus === 'saving' ? 'Syncing...' : 'Synced'}
            </span>
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="btn" 
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            File <ChevronDown size={12} />
          </button>
          
          {fileMenuOpen && (
            <>
              <div 
                onClick={() => setFileMenuOpen(false)} 
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              />
              <div className="glass-panel" style={{
                position: 'absolute',
                top: '32px',
                left: 0,
                width: '180px',
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 20,
              }}>
                <button 
                  className="btn" 
                  onClick={() => { onNew(); setFileMenuOpen(false); }}
                  style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                >
                  New Project...
                </button>
                <label 
                  className="btn" 
                  style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%', padding: '6px 10px', cursor: 'pointer' }}
                >
                  Open File...
                  <input 
                    type="file" 
                    accept=".gravity,.json" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          // trigger window event to load
                          const ev = new CustomEvent('import-project', { detail: { text, name: file.name } });
                          window.dispatchEvent(ev);
                        };
                        reader.readAsText(file);
                      }
                      setFileMenuOpen(false);
                    }}
                  />
                </label>
                <button 
                  className="btn" 
                  onClick={() => { onSave(); setFileMenuOpen(false); }}
                  style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                >
                  <Save size={14} /> Save Project (.gravity)
                </button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                
                {/* Export Submenu Trigger */}
                <div 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>Export As</span>
                  <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                </div>
                
                {exportMenuOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    left: '182px',
                    top: '90px',
                    width: '180px',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}>
                    <button 
                      className="btn" 
                      onClick={() => { onExportSVG(); setFileMenuOpen(false); setExportMenuOpen(false); }}
                      style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                    >
                      Export SVG Vector
                    </button>
                    <button 
                      className="btn" 
                      onClick={() => { onExportPNG(); setFileMenuOpen(false); setExportMenuOpen(false); }}
                      style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                    >
                      Export PNG Image
                    </button>
                    <button 
                      className="btn" 
                      onClick={() => { onExportCSS(); setFileMenuOpen(false); setExportMenuOpen(false); }}
                      style={{ border: 'none', background: 'transparent', justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                    >
                      Export CSS Keyframes
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <span style={{ fontSize: '13px', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
          {projectName}
        </span>
      </div>

      {/* Center section: Vector Drawing Tools */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        background: 'rgba(0,0,0,0.15)',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
      }}>
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.type;
          const isDisabled = isViewOnly && t.type !== 'select';
          return (
            <button
              key={t.type}
              className="btn btn-icon-only"
              title={isDisabled ? `${t.label} (Locked in View Mode)` : t.label}
              onClick={() => setActiveTool(t.type)}
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                border: 'none',
                color: isActive ? '#fff' : 'var(--text-main)',
                transition: 'all 0.15s ease',
                opacity: isDisabled ? 0.25 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                cursor: isDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Pencil Options Panel */}
      {activeTool === 'pencil' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          background: 'var(--bg-panel-solid)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-main)'
        }}>
          <span style={{ fontWeight: '600' }}>Pencil Size:</span>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={pencilSize} 
            onChange={(e) => setPencilSize(Number(e.target.value))}
            style={{ width: '70px', cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{pencilSize}px</span>
          
          <div style={{ height: '14px', width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />
          
          <span style={{ fontWeight: '600' }}>Color:</span>
          <input 
            type="color" 
            value={pencilColor} 
            onChange={(e) => setPencilColor(e.target.value)}
            style={{ width: '22px', height: '22px', border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer', padding: 0 }}
          />
        </div>
      )}

      {/* Eraser Options Panel */}
      {activeTool === 'eraser' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          background: 'var(--bg-panel-solid)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-main)'
        }}>
          <span style={{ fontWeight: '600' }}>Eraser Size:</span>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={eraserSize} 
            onChange={(e) => setEraserSize(Number(e.target.value))}
            style={{ width: '70px', cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'var(--font-mono)' }}>{eraserSize}px</span>
        </div>
      )}

      {/* Right section: Actions (Undo/Redo/Delete/Group/Zoom) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Edit Action Group (Disabled in View Only Mode) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          pointerEvents: isViewOnly ? 'none' : 'auto',
          opacity: isViewOnly ? 0.6 : 1
        }}>
          {/* Boolean Path Operations (When > 1 elements selected) */}
          {selectedCount > 1 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              borderRight: '1px solid var(--border-color)',
              paddingRight: '12px',
            }}>
              <button 
                className="btn btn-icon-only" 
                title="Union Shapes"
                onClick={() => onBooleanOp('union')}
              >
                <Combine size={15} />
              </button>
              <button 
                className="btn btn-icon-only" 
                title="Subtract Shapes"
                onClick={() => onBooleanOp('subtract')}
              >
                <Combine size={15} style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
          )}

          {/* Group / Ungroup Actions */}
          {selectedCount > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              borderRight: '1px solid var(--border-color)',
              paddingRight: '12px',
            }}>
              {selectedCount > 1 && (
                <button className="btn btn-icon-only" title="Group Selection" onClick={onGroup}>
                  <Group size={15} />
                </button>
              )}
              <button className="btn btn-icon-only" title="Ungroup Selection" onClick={onUngroup}>
                <Ungroup size={15} />
              </button>
            </div>
          )}

          {/* Undo, Redo, Delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              className="btn btn-icon-only" 
              disabled={!canUndo} 
              title="Undo" 
              onClick={onUndo}
              style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
            >
              <Undo2 size={15} />
            </button>
            <button 
              className="btn btn-icon-only" 
              disabled={!canRedo} 
              title="Redo" 
              onClick={onRedo}
              style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
            >
              <Redo2 size={15} />
            </button>
            <button 
              className="btn btn-icon-only" 
              disabled={selectedCount === 0} 
              title="Delete Selected" 
              onClick={onDeleteSelected}
              style={{ 
                opacity: selectedCount > 0 ? 1 : 0.4, 
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                color: selectedCount > 0 ? 'var(--accent-danger)' : 'var(--text-main)'
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Collaboration Suite Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
          <button 
            className="btn" 
            onClick={() => setShowShareModal(true)}
            style={{ 
              padding: '5px 10px', 
              fontSize: '11.5px',
              gap: '6px',
              background: 'var(--bg-panel-solid)',
              borderColor: 'var(--border-color)'
            }}
          >
            <Share2 size={13} /> Share
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setInPresentationMode(true)}
            style={{ 
              padding: '5px 12px', 
              fontSize: '11.5px',
              gap: '6px',
            }}
          >
            <Play size={12} fill="currentColor" /> Present
          </button>
        </div>

        {/* Zoom Control */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          borderLeft: '1px solid var(--border-color)',
          paddingLeft: '12px',
        }}>
          <button 
            className="btn" 
            style={{ padding: '4px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button className="btn btn-icon-only" style={{ width: '24px', height: '24px' }} title="Zoom In" onClick={() => setZoom(Math.min(10, zoom + 0.1))}>
            <Plus size={12} />
          </button>
          <button className="btn btn-icon-only" style={{ width: '24px', height: '24px' }} title="Zoom Out" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
            <span style={{ fontSize: '16px', lineHeight: 0, marginTop: '-6px' }}>-</span>
          </button>
        </div>
      </div>
    </header>
  );
};
export default Toolbar;
