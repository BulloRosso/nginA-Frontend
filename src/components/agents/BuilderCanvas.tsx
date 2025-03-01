// src/components/agents/BuilderCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, styled, IconButton, Slider, Stack } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Svg2Roughjs } from 'svg2roughjs';
import TransformationTester from './TransformationTester';
import useAgentStore from '../../../stores/agentStore';
import { AgentService } from '../../services/agents';

// Default RoughJS options
const DEFAULT_ROUGH_OPTIONS = {
  roughness: 1.5,
  bowing: 1,
  fillStyle: 'hachure',
  stroke: '#000000',
  strokeWidth: 1.5,
  disableMultiStroke: false,
  disableMultiStrokeFill: false
};

// Default diagram style options
const DEFAULT_DIAGRAM_STYLES = {
  fontFamily: 'Annie Use Your Telescope, cursive',
  boxBorderWidth: 2,
  boxBorderColor: '#1eb3b7',
  boxBgColor: '#f2f0e8',
  edgeLabelBgColor: '#ffffff',
  nodeLabelColor: '#333333',
  edgeLabelColor: '#333333'
};

// Define the props interface
interface BuilderCanvasProps {
  activeStep?: number;
  mermaid_markdown?: string;
  backgroundImage?: string;
  // RoughJS configuration parameters
  roughOptions?: {
    roughness?: number;
    bowing?: number;
    fill?: string;
    fillStyle?: string;
    fillWeight?: number;
    stroke?: string;
    strokeWidth?: number;
    disableMultiStroke?: boolean;
    disableMultiStrokeFill?: boolean;
    seed?: number;
  };
  // Diagram style customization
  diagramStyles?: {
    fontFamily?: string;
    boxBorderWidth?: number;
    boxBorderColor?: string;
    boxBgColor?: string;
    edgeLabelBgColor?: string;
    nodeLabelColor?: string;
    edgeLabelColor?: string;
  };
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

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  activeStep = 0,
  mermaid_markdown,
  backgroundImage = '/img/builder-background-grey.jpg',
  roughOptions = {},
  diagramStyles = {}
}) => {
  const { currentAgentChain, currentAgentTransformations } = useAgentStore();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const mermaidRef = useRef<HTMLDivElement>(null);
  const roughOutputRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1.2);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate mermaid diagram from agent chain
  const generateMermaidFromAgentChain = () => {
    if (currentAgentChain.length === 0) {
      return `flowchart LR
        A[No Agents] --- B[Add agents to create a workflow]`;
    }

    let flowchartCode = 'flowchart LR\n';

    // Add nodes for each agent
    currentAgentChain.forEach((agent, index) => {
      const nodeId = `A${index}`;
      const nodeLabel = agent.agent_title;

      // Determine node shape based on its position in the chain
      let nodeShape = '(';
      let nodeEndShape = ')';

      if (index === 0) {
        // First node - rounded rectangle
        nodeShape = '(';
        nodeEndShape = ')';
      } else if (index === currentAgentChain.length - 1) {
        // Last node - rounded rectangle
        nodeShape = '(';
        nodeEndShape = ')';
      } else if (index % 3 === 0) {
        // Every 3rd node - diamond
        nodeShape = '{';
        nodeEndShape = '}';
      } else if (index % 2 === 0) {
        // Every 2nd node - hexagon
        nodeShape = '{{';
        nodeEndShape = '}}';
      } else {
        // Other nodes - rectangle
        nodeShape = '[';
        nodeEndShape = ']';
      }

      flowchartCode += `    ${nodeId}${nodeShape}${nodeLabel}${nodeEndShape}\n`;
    });

    // Add connections between nodes
    for (let i = 0; i < currentAgentChain.length - 1; i++) {
      flowchartCode += `    A${i} --> A${i+1}\n`;
    }

    return flowchartCode;
  };

  // Load agents when the component mounts
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const fetchedAgents = await AgentService.getAgents();
        setAgents(fetchedAgents);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Handle zoom changes
  const handleZoom = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(3, newScale)));
  };

  // Reset zoom and position
  const resetView = () => {
    setScale(1.2);
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

  // Apply custom styles to the SVG before rendering with RoughJS
  const applyCustomStylesToSvg = (svgElement: SVGSVGElement) => {
    const styles = {
      ...DEFAULT_DIAGRAM_STYLES,
      ...diagramStyles
    };

    // Create a style element to inject custom CSS
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `
      /* Font styles for all text */
      #${svgElement.id} text {
        font-family: ${styles.fontFamily} !important;
      }

      /* Node styles - boxes and shapes */
      .node rect, .node circle, .node ellipse, .node polygon, .node path {
        stroke-width: ${styles.boxBorderWidth}px !important;
        stroke: ${styles.boxBorderColor} !important;
        fill: ${styles.boxBgColor} !important;
      }

      /* Node label styles */
      .node text {
        fill: ${styles.nodeLabelColor} !important;
      }

      /* Edge label styles */
      .edgeLabel rect {
        fill: ${styles.edgeLabelBgColor} !important;
      }

      .edgeLabel text {
        fill: ${styles.edgeLabelColor} !important;
      }
    `;

    // Add the style element to the SVG
    svgElement.appendChild(styleEl);

    return svgElement;
  };

  // Apply RoughJS to the SVG
  const applyRoughJsToSvg = (svgElement: SVGSVGElement) => {
    if (!roughOutputRef.current) return;

    try {
      // Clear previous content
      roughOutputRef.current.innerHTML = '';

      // First apply custom styles to the SVG
      applyCustomStylesToSvg(svgElement);

      // Create a new Svg2Roughjs instance with the output div
      const svg2rough = new Svg2Roughjs(
        roughOutputRef.current,
        0, // OutputType.SVG (0 = SVG, 1 = CANVAS)
        {
          ...DEFAULT_ROUGH_OPTIONS,
          ...roughOptions
        }
      );

      // Configure additional options
      svg2rough.randomize = true;      // Enable randomization for more hand-drawn feel
      svg2rough.sketchPatterns = true; // Enable sketching patterns

      // Set the custom font family
      svg2rough.fontFamily = diagramStyles.fontFamily || DEFAULT_DIAGRAM_STYLES.fontFamily;

      // Set the SVG to be converted
      svg2rough.svg = svgElement;

      // Trigger the sketch rendering
      svg2rough.sketch().catch(error => {
        console.error("Error in sketch process:", error);
      });
    } catch (error) {
      console.error("Error applying RoughJS:", error);
      // If it fails, show the original SVG as fallback
      if (mermaidRef.current && mermaidRef.current.querySelector('svg')) {
        const originalSvg = mermaidRef.current.querySelector('svg')?.cloneNode(true);
        if (originalSvg && roughOutputRef.current) {
          roughOutputRef.current.innerHTML = '';
          roughOutputRef.current.appendChild(originalSvg);
        }
      }
    }
  };

  // Render the mermaid diagram and apply RoughJS
  useEffect(() => {
    if (activeStep !== 0) return;

    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: 'loose',
      fontFamily: diagramStyles.fontFamily || DEFAULT_DIAGRAM_STYLES.fontFamily,
      theme: 'default',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
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

        // Use agent chain data or fallback to provided markdown or default
        const markdownToRender = mermaid_markdown || generateMermaidFromAgentChain();

        // Use the async render method with proper error handling
        mermaid.render(uniqueId, markdownToRender)
          .then((result) => {
            if (mermaidRef.current) {
              // Insert the SVG into the mermaid ref div
              mermaidRef.current.innerHTML = result.svg;

              // Get the SVG element
              const svgElement = mermaidRef.current.querySelector('svg');
              if (svgElement) {
                // Apply basic styling to make it visible on the background
                svgElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                svgElement.style.borderRadius = '0';
                svgElement.style.padding = '0';
                svgElement.style.maxWidth = '100%';

                // Process with RoughJS after a small delay to ensure DOM is ready
                setTimeout(() => {
                  applyRoughJsToSvg(svgElement as SVGSVGElement);
                }, 100);
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
  }, [
    mermaid_markdown, 
    roughOptions, 
    diagramStyles, 
    activeStep, 
    currentAgentChain
  ]);

  return (
    <>
      {activeStep === 0 && (
        <BackgroundContainer 
          backgroundImage={backgroundImage}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* Original mermaid rendering div - hidden */}
          <div 
            ref={mermaidRef} 
            style={{ 
              display: 'none', // Hidden
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />

          {/* Output container for the RoughJS SVG */}
          <div
            ref={roughOutputRef}
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
                max={3}
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
      )}

      {activeStep === 1 && (
        <Box sx={{ height: '503px', width: '100%' }}>
          <TransformationTester agents={agents} />
        </Box>
      )}
    </>
  );
};

export default BuilderCanvas;