import React from 'react';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignEndVertical, AlignCenterVertical
} from 'lucide-react';
import type { VectorElement, Page } from '../types/vector';

interface InspectorProps {
  selectedElements: VectorElement[];
  onUpdateElements: (updated: Partial<VectorElement>[], overwrite?: boolean) => void;
  page: Page;
  onUpdatePage: (updated: Partial<Page>) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  loadedFonts: string[];
  onLoadFont: (fontName: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedElements,
  onUpdateElements,
  page,
  onUpdatePage,
  gridSize,
  setGridSize,
  gridEnabled,
  setGridEnabled,
  onAlign,
  loadedFonts,
  onLoadFont,
}) => {
  const isSingle = selectedElements.length === 1;
  const isMulti = selectedElements.length > 1;
  const element = isSingle ? selectedElements[0] : null;

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9\-]/g, '');
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        
        // Append style element to document head
        const styleId = `uploaded-font-${fontName.toLowerCase()}`;
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        
        styleEl.innerHTML = `
          @font-face {
            font-family: '${fontName}';
            src: url('${dataUrl}') format('truetype');
          }
        `;
        
        // Register in state and apply
        onLoadFont(fontName);
        handleTextChange('fontFamily', fontName);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleTransformChange = (key: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'cornerRadius', value: number) => {
    if (!element) return;
    onUpdateElements([{ id: element.id, [key]: value }], true);
  };

  const handleTextChange = (key: 'text' | 'fontSize' | 'fontFamily' | 'fontWeight' | 'textAlign', value: any) => {
    if (!element) return;
    onUpdateElements([{ id: element.id, [key]: value }], true);
  };

  const handleFillChange = (color: string) => {
    if (element) {
      onUpdateElements([{ id: element.id, fill: color, fillGradient: undefined }]);
    }
  };

  const handleStrokeChange = (key: 'stroke' | 'strokeWidth', value: any) => {
    if (element) {
      onUpdateElements([{ id: element.id, [key]: value }]);
    }
  };

  const handleOpacityChange = (value: number) => {
    if (element) {
      onUpdateElements([{ id: element.id, opacity: value }], true);
    }
  };

  const handleShadowChange = (key: string, value: any) => {
    if (!element) return;
    const currentShadow = element.shadow || { color: '#000000', blur: 4, offsetX: 2, offsetY: 2, opacity: 0.3 };
    onUpdateElements([{
      id: element.id,
      shadow: { ...currentShadow, [key]: value }
    }], true);
  };

  const handleGradientAddStop = () => {
    if (!element) return;
    const grad = element.fillGradient || { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#ec4899' }] };
    const newStops = [...grad.stops, { offset: 0.5, color: '#ffffff' }].sort((a,b) => a.offset - b.offset);
    onUpdateElements([{
      id: element.id,
      fill: 'url(#grad-' + element.id + ')',
      fillGradient: { ...grad, stops: newStops }
    }]);
  };

  const handleGradientChangeStop = (index: number, key: 'offset' | 'color', val: any) => {
    if (!element || !element.fillGradient) return;
    const grad = element.fillGradient;
    const newStops = grad.stops.map((s, i) => i === index ? { ...s, [key]: val } : s);
    onUpdateElements([{
      id: element.id,
      fillGradient: { ...grad, stops: newStops }
    }], true);
  };

  const handleGradientToggle = (type: 'linear' | 'radial' | 'solid') => {
    if (!element) return;
    if (type === 'solid') {
      onUpdateElements([{ id: element.id, fill: '#8b5cf6', fillGradient: undefined }]);
    } else {
      onUpdateElements([{
        id: element.id,
        fill: `url(#grad-${element.id})`,
        fillGradient: {
          type,
          angle: 90,
          stops: [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#ec4899' }
          ]
        }
      }]);
    }
  };

  return (
    <aside className="glass-panel" style={{
      width: 'var(--inspector-width)',
      height: '100%',
      borderLeft: '1px solid var(--border-color)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      zIndex: 50,
    }}>
      {/* Alignment Panel (Visible for multiple elements) */}
      {(isMulti || isSingle) && (
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', padding: '12px 14px', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Align</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-icon-only" title="Align Left" onClick={() => onAlign('left')} style={{ flex: 1 }}><AlignLeft size={14} /></button>
            <button className="btn btn-icon-only" title="Align Center" onClick={() => onAlign('center')} style={{ flex: 1 }}><AlignCenter size={14} /></button>
            <button className="btn btn-icon-only" title="Align Right" onClick={() => onAlign('right')} style={{ flex: 1 }}><AlignRight size={14} /></button>
            <button className="btn btn-icon-only" title="Align Top" onClick={() => onAlign('top')} style={{ flex: 1 }}><AlignStartVertical size={14} style={{ transform: 'rotate(90deg)' }} /></button>
            <button className="btn btn-icon-only" title="Align Middle" onClick={() => onAlign('middle')} style={{ flex: 1 }}><AlignCenterVertical size={14} style={{ transform: 'rotate(90deg)' }} /></button>
            <button className="btn btn-icon-only" title="Align Bottom" onClick={() => onAlign('bottom')} style={{ flex: 1 }}><AlignEndVertical size={14} style={{ transform: 'rotate(90deg)' }} /></button>
          </div>
        </div>
      )}

      {/* Geometry / Transform Panel */}
      {element && (
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', padding: '14px', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Geometry</span>
            <span style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}>{element.type}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '12px' }}>X</span>
              <input type="number" value={Math.round(element.x)} onChange={(e) => handleTransformChange('x', parseFloat(e.target.value) || 0)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '12px' }}>Y</span>
              <input type="number" value={Math.round(element.y)} onChange={(e) => handleTransformChange('y', parseFloat(e.target.value) || 0)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '12px' }}>W</span>
              <input type="number" value={Math.round(element.width)} min="1" onChange={(e) => handleTransformChange('width', parseFloat(e.target.value) || 1)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '12px' }}>H</span>
              <input type="number" value={Math.round(element.height)} min="1" onChange={(e) => handleTransformChange('height', parseFloat(e.target.value) || 1)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '12px' }}>R°</span>
              <input type="number" value={Math.round(element.rotation)} onChange={(e) => handleTransformChange('rotation', parseFloat(e.target.value) || 0)} style={{ width: '100%' }} />
            </div>

            {element.type === 'rectangle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '80px' }}>Corner Radius</span>
                <input type="number" value={element.cornerRadius || 0} min="0" onChange={(e) => handleTransformChange('cornerRadius', parseFloat(e.target.value) || 0)} style={{ width: '100%' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Typography settings (If text selected) */}
      {element && element.type === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', padding: '14px', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Typography</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Text Value</label>
            <textarea 
              value={element.text || ''} 
              onChange={(e) => handleTextChange('text', e.target.value)} 
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Font Family</label>
              <select value={element.fontFamily || 'Outfit'} onChange={(e) => handleTextChange('fontFamily', e.target.value)} style={{ width: '100%', minWidth: 0 }}>
                {loadedFonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Size (px)</label>
              <input type="number" value={element.fontSize || 16} min="8" onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value) || 16)} />
            </div>

            {/* Custom Font File Uploader */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2', marginTop: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Upload Font File (.ttf, .otf, .woff)</label>
              <input 
                type="file" 
                accept=".ttf,.otf,.woff,.woff2" 
                onChange={handleFontUpload}
                style={{ display: 'none' }}
                id="font-file-upload-input"
              />
              <label 
                htmlFor="font-file-upload-input" 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  fontSize: '11.5px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                Upload Custom Font
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Fill (Colors/Gradients) Settings */}
      {element && element.type !== 'line' && (
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', padding: '14px', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fill Style</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn" 
                style={{ padding: '2px 6px', fontSize: '10px', background: !element.fillGradient ? 'var(--bg-control-active)' : 'transparent' }}
                onClick={() => handleGradientToggle('solid')}
              >
                Solid
              </button>
              <button 
                className="btn" 
                style={{ padding: '2px 6px', fontSize: '10px', background: element.fillGradient?.type === 'linear' ? 'var(--bg-control-active)' : 'transparent' }}
                onClick={() => handleGradientToggle('linear')}
              >
                Linear
              </button>
              <button 
                className="btn" 
                style={{ padding: '2px 6px', fontSize: '10px', background: element.fillGradient?.type === 'radial' ? 'var(--bg-control-active)' : 'transparent' }}
                onClick={() => handleGradientToggle('radial')}
              >
                Radial
              </button>
            </div>
          </div>

          {!element.fillGradient ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="color" 
                value={element.fill === 'none' ? '#000000' : element.fill} 
                onChange={(e) => handleFillChange(e.target.value)} 
              />
              <input 
                type="text" 
                value={element.fill} 
                onChange={(e) => handleFillChange(e.target.value)} 
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }} 
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {element.fillGradient.type === 'linear' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Angle</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={element.fillGradient.angle} 
                    onChange={(e) => {
                      const angle = parseInt(e.target.value);
                      onUpdateElements([{ id: element.id, fillGradient: { ...element.fillGradient!, angle } }], true);
                    }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{element.fillGradient.angle}°</span>
                </div>
              )}
              
              {/* Gradient Stops editing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Gradient Stops</span>
                  <button className="btn" style={{ padding: '2px 6px', fontSize: '9px' }} onClick={handleGradientAddStop}>Add Stop</button>
                </div>

                {element.fillGradient.stops.map((stop, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="color" 
                      value={stop.color} 
                      onChange={(e) => handleGradientChangeStop(i, 'color', e.target.value)} 
                    />
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={stop.offset} 
                      onChange={(e) => handleGradientChangeStop(i, 'offset', parseFloat(e.target.value))}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', width: '32px' }}>{Math.round(stop.offset * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stroke / Borders Settings */}
      {element && (
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', padding: '14px', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Border</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="color" 
              value={element.stroke === 'none' ? '#000000' : element.stroke} 
              onChange={(e) => handleStrokeChange('stroke', e.target.value)} 
            />
            <input 
              type="text" 
              value={element.stroke} 
              onChange={(e) => handleStrokeChange('stroke', e.target.value)} 
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Width</span>
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={element.strokeWidth} 
              onChange={(e) => handleStrokeChange('strokeWidth', parseInt(e.target.value))} 
            />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', width: '24px' }}>{element.strokeWidth}px</span>
          </div>
        </div>
      )}

      {/* Effects & Opacity Settings */}
      {element && (
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', padding: '14px', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Opacity & Shadow</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Opacity</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={element.opacity} 
              onChange={(e) => handleOpacityChange(parseFloat(e.target.value))} 
            />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', width: '32px' }}>{Math.round(element.opacity * 100)}%</span>
          </div>

          {/* Shadow Offset & Blur controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>Drop Shadow</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '40px' }}>Color</span>
              <input 
                type="color" 
                value={element.shadow?.color || '#000000'} 
                onChange={(e) => handleShadowChange('color', e.target.value)} 
              />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={element.shadow?.opacity ?? 0.3} 
                onChange={(e) => handleShadowChange('opacity', parseFloat(e.target.value))} 
              />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{Math.round((element.shadow?.opacity ?? 0.3) * 100)}%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>X</span>
                <input type="number" style={{ width: '100%', padding: '4px' }} value={element.shadow?.offsetX ?? 2} onChange={(e) => handleShadowChange('offsetX', parseFloat(e.target.value) || 0)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Y</span>
                <input type="number" style={{ width: '100%', padding: '4px' }} value={element.shadow?.offsetY ?? 2} onChange={(e) => handleShadowChange('offsetY', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', width: '40px' }}>Blur</span>
              <input 
                type="range" 
                min="0" 
                max="40" 
                value={element.shadow?.blur ?? 4} 
                onChange={(e) => handleShadowChange('blur', parseInt(e.target.value))} 
              />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{element.shadow?.blur ?? 4}px</span>
            </div>
          </div>
        </div>
      )}

      {/* Global Page Properties (Visible when NO selection active) */}
      {!element && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '14px', gap: '14px' }}>
          
          {/* Canvas size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Artboard Size</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Width</label>
                <input type="number" min="50" value={page.width} onChange={(e) => onUpdatePage({ width: parseInt(e.target.value) || 800 })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Height</label>
                <input type="number" min="50" value={page.height} onChange={(e) => onUpdatePage({ height: parseInt(e.target.value) || 600 })} />
              </div>
            </div>
          </div>

          {/* Background settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Canvas Background Color</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={page.background.startsWith('#') ? page.background : '#1e1f29'} onChange={(e) => onUpdatePage({ background: e.target.value })} />
              <input type="text" value={page.background} onChange={(e) => onUpdatePage({ background: e.target.value })} style={{ flex: 1, fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>

          {/* Grid settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Grid Settings</span>
              <input type="checkbox" checked={gridEnabled} onChange={(e) => setGridEnabled(e.target.checked)} />
            </div>
            
            {gridEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Grid Size</span>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5" 
                  value={gridSize} 
                  onChange={(e) => setGridSize(parseInt(e.target.value))} 
                />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{gridSize}px</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
export default Inspector;
