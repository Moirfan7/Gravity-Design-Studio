import React, { useState } from 'react';
import { 
  Layers, Plus, Trash2, Eye, EyeOff, 
  Square, Circle, Type, FileCode, Minimize, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown
} from 'lucide-react';
import type { Page, VectorElement } from '../types/vector';

interface SidebarProps {
  pages: Page[];
  activePageId: string;
  setActivePageId: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  elements: VectorElement[];
  selectedIds: string[];
  onSelectElement: (id: string, isShift: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onRenameElement: (id: string, newName: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pages,
  activePageId,
  setActivePageId,
  onAddPage,
  onDeletePage,
  elements,
  selectedIds,
  onSelectElement,
  onToggleVisibility,
  onRenameElement,
  onMoveLayer,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [pagesExpanded, setPagesExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);

  const getElementIcon = (type: VectorElement['type']) => {
    switch (type) {
      case 'rectangle': return <Square size={13} color="var(--accent)" />;
      case 'ellipse': return <Circle size={13} color="var(--accent-secondary)" />;
      case 'text': return <Type size={13} color="var(--accent-cyan)" />;
      case 'path': return <FileCode size={13} color="var(--accent-success)" />;
      case 'line': return <Minimize size={13} style={{ transform: 'rotate(45deg)' }} color="var(--accent-warning)" />;
    }
  };

  const handleStartRename = (el: VectorElement) => {
    setEditingId(el.id);
    setEditName(el.name);
  };

  const handleFinishRename = (id: string) => {
    if (editName.trim()) {
      onRenameElement(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="glass-panel" style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      zIndex: 50,
    }}>
      {/* Pages Section */}
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '35%', borderBottom: '1px solid var(--border-color)' }}>
        <div className="panel-title" onClick={() => setPagesExpanded(!pagesExpanded)} style={{ cursor: 'pointer' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {pagesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Pages ({pages.length})
          </span>
          <button 
            className="btn btn-icon-only" 
            style={{ width: '20px', height: '20px', border: 'none', background: 'transparent' }}
            onClick={(e) => { e.stopPropagation(); onAddPage(); }}
            title="Add Page"
          >
            <Plus size={14} />
          </button>
        </div>

        {pagesExpanded && (
          <div style={{ overflowY: 'auto', padding: '6px' }}>
            {pages.map((p) => {
              const isActive = p.id === activePageId;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePageId(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: isActive ? 'var(--bg-control-active)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-color-active)' : 'transparent'}`,
                    marginBottom: '2px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: isActive ? '#fff' : 'var(--text-main)', fontWeight: isActive ? '500' : '400' }}>
                    {p.name}
                  </span>
                  
                  {pages.length > 1 && (
                    <button
                      className="btn btn-icon-only"
                      style={{ width: '20px', height: '20px', border: 'none', background: 'transparent' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(p.id);
                      }}
                      title="Delete Page"
                    >
                      <Trash2 size={12} color="var(--text-dim)" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Layers Section */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="panel-title" onClick={() => setLayersExpanded(!layersExpanded)} style={{ cursor: 'pointer' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {layersExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Layers ({elements.length})
          </span>
          <Layers size={13} color="var(--text-dim)" />
        </div>

        {layersExpanded && (
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
            {elements.length === 0 ? (
              <div style={{ padding: '24px 16px', fontSize: '12px', textAlign: 'center', color: 'var(--text-dim)' }}>
                No layers yet. Draw shapes on canvas to create them.
              </div>
            ) : (
              // Elements in layers are rendered from TOP to BOTTOM in listing,
              // which usually means elements at index elements.length-1 (frontmost) are listed FIRST!
              [...elements].reverse().map((el) => {
                const isSelected = selectedIds.includes(el.id);
                const isHidden = el.opacity === 0; // Simple hide
                
                return (
                  <div
                    key={el.id}
                    onClick={(e) => onSelectElement(el.id, e.shiftKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-control-active)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-color-active)' : 'transparent'}`,
                      marginBottom: '2px',
                      gap: '8px',
                      transition: 'all 0.1s ease',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Element Icon */}
                    {getElementIcon(el.type)}

                    {/* Name/Rename input */}
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {editingId === el.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleFinishRename(el.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishRename(el.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '1px 4px',
                            fontSize: '12px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--accent)',
                          }}
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartRename(el)}
                          style={{
                            color: isSelected ? '#fff' : 'var(--text-main)',
                            textDecoration: isHidden ? 'line-through' : 'none',
                            opacity: isHidden ? 0.5 : 1,
                          }}
                        >
                          {el.name}
                        </span>
                      )}
                    </div>

                    {/* Action Controls: visibility, lock, move up/down */}
                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}>
                        <button 
                          className="btn btn-icon-only"
                          style={{ width: '20px', height: '20px', border: 'none', background: 'transparent' }}
                          title="Move Up"
                          onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'up'); }}
                        >
                          <ArrowUp size={12} color="var(--text-main)" />
                        </button>
                        <button 
                          className="btn btn-icon-only"
                          style={{ width: '20px', height: '20px', border: 'none', background: 'transparent' }}
                          title="Move Down"
                          onClick={(e) => { e.stopPropagation(); onMoveLayer(el.id, 'down'); }}
                        >
                          <ArrowDown size={12} color="var(--text-main)" />
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-icon-only"
                        style={{ width: '20px', height: '20px', border: 'none', background: 'transparent' }}
                        onClick={() => onToggleVisibility(el.id)}
                        title={isHidden ? "Show layer" : "Hide layer"}
                      >
                        {isHidden ? <EyeOff size={12} color="var(--text-dim)" /> : <Eye size={12} color="var(--text-muted)" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
