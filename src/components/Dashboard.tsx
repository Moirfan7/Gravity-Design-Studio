import React, { useState } from 'react';
import { Layout, Smartphone, Tv, Image, Upload, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onCreateProject: (width: number, height: number, name: string) => void;
  onImportProject: (fileContent: string, fileName: string) => void;
}

const PRESETS = [
  { name: 'Desktop Web', width: 1280, height: 800, icon: Tv, desc: '1280 x 800 px' },
  { name: 'Mobile App', width: 375, height: 812, icon: Smartphone, desc: '375 x 812 px' },
  { name: 'Instagram Post', width: 1080, height: 1080, icon: Image, desc: '1080 x 1080 px' },
  { name: 'HD Presentation', width: 1920, height: 1080, icon: Layout, desc: '1920 x 1080 px' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onCreateProject, onImportProject }) => {
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [projectName, setProjectName] = useState('Untitled Design');
  const [dragActive, setDragActive] = useState(false);

  const handleCreateCustom = () => {
    if (customWidth > 0 && customHeight > 0) {
      onCreateProject(customWidth, customHeight, projectName || 'Untitled Design');
    }
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    onCreateProject(preset.width, preset.height, `${preset.name} - ${projectName || 'Untitled'}`);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onImportProject(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-card">
        
        {/* Left side: Brand and Creator */}
        <div className="dashboard-brand">
          <div className="dashboard-logo">
            <span>Gravity</span> Design Studio
          </div>
          <div className="dashboard-subtitle">
            Create high-fidelity vector illustrations and fluid timeline-based motion graphics in a single, lightning-fast workspace.
          </div>
          
          {/* Custom Size Form */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project Name</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                placeholder="e.g. Logo Animation"
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Width (px)</label>
                <input 
                  type="number" 
                  value={customWidth} 
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Height (px)</label>
                <input 
                  type="number" 
                  value={customHeight} 
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleCreateCustom} style={{ marginTop: '6px', justifyContent: 'center' }}>
              Create Custom Canvas <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right side: Presets and Import */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Choose a Canvas Preset</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Start drawing with common canvas dimensions</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <div 
                  key={preset.name}
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-control)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Icon size={20} color="var(--accent)" />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{preset.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{preset.desc}</span>
                </div>
              );
            })}
          </div>

          <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          {/* Import Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '24px 16px',
              background: dragActive ? 'var(--bg-control-active)' : 'rgba(255,255,255,0.01)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              position: 'relative',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <input 
              type="file" 
              accept=".gravity,.json,.svg" 
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <Upload size={28} color="var(--text-muted)" />
            <div style={{ fontSize: '13px', fontWeight: '500' }}>Open Existing Project</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Drag & drop a <b>.gravity</b> project file or standard <b>.svg</b> vector file
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
