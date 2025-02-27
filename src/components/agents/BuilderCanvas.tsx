import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, styled, IconButton, Slider, Stack } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Define the props interface
interface BuilderCanvasProps {
  mermaid_markdown?: string;
  backgroundImage?: string;
}

// Create a styled component for the background container
const BackgroundContainer = styled(Box)<{ backgroundImage?: string }>(({ backgroundImage }) => ({
  backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
  backgroundRepeat: 'repeat',
  width: '100%',
  height: '100%',
  minHeight: '503px',
  maxHeight: '503px',
  position: 'relative',
  overflow: 'hidden',
}));

// Control panel styled component
const ControlPanel = styled(Box)({
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  borderRadius: '8px',
  padding: '5px',
  zIndex: 10,
});

// Default mermaid markdown if none is provided
const DEFAULT_MERMAID = `flowchart LR
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
    `;

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  mermaid_markdown,
  backgroundImage = '/img/builder-background.jpg', // Replace with your default background
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Handle zoom changes
  const handleZoom = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(1, newScale)));
  };

  // Reset zoom and position
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setPosition({
      x: position.x + dx,
      y: position.y + dy
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // End dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: 'loose', // Adjust based on your security requirements
      fontFamily: 'Roboto, sans-serif',
      theme: 'default', // Add theme setting
        
        flowchart: {
          htmlLabels: true,
          curve: 'basis', // 'linear', 'basis', 'natural', 'step'
          useMaxWidth: false,
          diagramPadding: 0,
          nodeSpacing: 50,
          rankSpacing: 50,
        }
      
    });

    // Render the diagram
    if (mermaidRef.current) {
      try {
        mermaidRef.current.innerHTML = '';
        const uniqueId = 'mermaid-diagram-' + Date.now();
        const markdownToRender = mermaid_markdown || DEFAULT_MERMAID;

        // Use the async render method with proper error handling
        mermaid.render(uniqueId, markdownToRender)
          .then((result) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = result.svg;

              // Add some custom styling to make the diagram more visible on the background
              const svgElement = mermaidRef.current.querySelector('svg');
              if (svgElement) {
                // Apply styling to make the diagram stand out on the background
                svgElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                svgElement.style.borderRadius = '0';
                svgElement.style.padding = '0';
                svgElement.style.maxWidth = '100%';
              }
              
            }
          })
          .catch((error) => {
            console.error('Error rendering mermaid diagram:', error);
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: rgba(255,200,200,0.7);">
                Error rendering diagram: ${error instanceof Error ? error.message : String(error)}
              </div>`;
            }
          });
      } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: rgba(255,200,200,0.7);">
            Error rendering diagram: ${error instanceof Error ? error.message : String(error)}
          </div>`;
        }
      }
    }
  }, [mermaid_markdown]);

  return (
    <BackgroundContainer 
      backgroundImage={backgroundImage}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        ref={mermaidRef} 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '20px',
          height: '100%',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      />
      <ControlPanel>
        <Stack spacing={1} direction="row" alignItems="center" sx={{ width: 200 }}>
          <IconButton size="small" onClick={() => handleZoom(scale - 0.1)}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <Slider
            size="small"
            value={scale}
            min={0.5}
            max={1}
            step={0.1}
            onChange={(_, value) => handleZoom(value as number)}
          />
          <IconButton size="small" onClick={() => handleZoom(scale + 0.1)}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={resetView}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Stack>
      </ControlPanel>
    </BackgroundContainer>
  );
};

export default BuilderCanvas;