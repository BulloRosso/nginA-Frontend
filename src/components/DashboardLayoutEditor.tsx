import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  List,
  ListItem,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DashboardComponent } from '../types/dashboard';
import { useTranslation } from 'react-i18next';
// Import all tile components for settings rendering
import TileDisplayMarkdown from './dashboards/TileDisplayMarkdown';
import TileChatbot from './dashboards/TileChatbot';
import TileKPI from './dashboards/TileKPI';
import TileScratchpadBrowser from './dashboards/TileScratchpadBrowser';
import TileAgentLauncher from './dashboards/TileAgentLauncher';

// Define the type for a component placed on the grid
export interface PlacedComponent {
  id: string;
  startRow: number;
  startCol: number;
  name: string;
  type: string;
  colSpan: number;
  rowSpan: number;
  settings?: any;
}

// Define type for drag item
interface DragItem {
  type: string;
  component: DashboardComponent;
  isPlaced?: boolean;
  placedIndex?: string;
}

// Map of component types to their React components
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  'TileDisplayMarkdown': TileDisplayMarkdown,
  'DisplayMarkdown': TileDisplayMarkdown,
  'TileChatbot': TileChatbot,
  'Chatbot': TileChatbot,
  'TileKPI': TileKPI,
  'KPI': TileKPI,
  'TileScratchpadBrowser': TileScratchpadBrowser,
  'ScratchpadBrowser': TileScratchpadBrowser,
  'TileAgentLauncher': TileAgentLauncher,
  'AgentLauncher': TileAgentLauncher
};

// DraggableComponent for components in the component list
const DraggableComponent: React.FC<{
  component: DashboardComponent;
}> = ({ component }) => {
  const { t, i18n } = useTranslation('agents');
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: { 
      type: 'COMPONENT', 
      component: component
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [component.id, component.name, component.type, component.layout_cols, component.layout_rows]); // Add dependencies

  return (
    <Card
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        mb: 0,
        pt: 1,
        bgcolor: '#f5f5f5',
        height: '55px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <CardContent sx={{ width: '100%' }}>
        <Typography variant="body2">{t('agents.dashboards.' + component.name)}</Typography>
        <Typography variant="caption" color="text.secondary">
          {component.type} ({component.layout_cols}x{component.layout_rows})
        </Typography>
      </CardContent>
    </Card>
  );
};

// PlacedComponent for components already placed on the grid
const PlacedComponentItem: React.FC<{
  component: PlacedComponent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}> = ({ component, isSelected, onSelect, onRemove }) => {
  const { t, i18n } = useTranslation('agents');
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PLACED_COMPONENT',
    item: { 
      type: 'PLACED_COMPONENT', 
      component: {
        id: component.id,
        name: component.name,
        type: component.type,
        layout_cols: component.colSpan,
        layout_rows: component.rowSpan,
        settings: component.settings
      },
      isPlaced: true,
      placedIndex: component.id 
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [component.id, component.name, component.type, component.colSpan, component.rowSpan, component.settings]);  // Add dependencies

  return (
    <Paper
      ref={drag}
      elevation={3}
      onClick={onSelect}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'move',
        backgroundColor: 'white',
        opacity: isDragging ? 0.5 : 1,
        border: isSelected ? '2px solid gold' : 'none',
        '&:hover': {
          boxShadow: 5,
        },
      }}
    >
      <Typography variant="body2" align="center">
        {t('agents.dashboards.' + component.name)}
      </Typography>
      <Typography variant="caption" color="text.secondary" align="center">
        ({component.type})
      </Typography>
      <Typography variant="caption" color="text.secondary" align="center">
        {component.startRow},{component.startCol} • {component.colSpan}×{component.rowSpan}
      </Typography>
      {isSelected && (
        <Box 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'error.main',
            color: 'white',
            borderRadius: '0 0 0 4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ×
        </Box>
      )}
    </Paper>
  );
};

// GridCell component for each cell in the layout grid
const GridCell: React.FC<{
  row: number;
  col: number;
  placedComponents: PlacedComponent[];
  onAddComponent: (component: DashboardComponent, row: number, col: number) => void;
  onMoveComponent: (id: string, row: number, col: number) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  onRemoveComponent: (id: string) => void;
}> = ({ 
  row, 
  col, 
  placedComponents, 
  onAddComponent, 
  onMoveComponent, 
  selectedComponentId,
  onSelectComponent,
  onRemoveComponent
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['COMPONENT', 'PLACED_COMPONENT'],
    drop: (item: DragItem) => {
      console.log("Drop event:", { item, row, col });
      if (item.isPlaced) {
        console.log("Moving component:", item.placedIndex, "to", row, col);
        onMoveComponent(item.placedIndex!, row, col);
      } else {
        console.log("Adding component:", item.component, "at", row, col);
        onAddComponent(item.component, row, col);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [row, col, onAddComponent, onMoveComponent]); // Add dependencies

  // Find component for this cell
  const componentForCell = placedComponents.find(c => 
    row >= c.startRow && 
    row < c.startRow + c.rowSpan &&
    col >= c.startCol && 
    col < c.startCol + c.colSpan
  );

  // Check if this is the starting cell for a component
  const isStartCell = componentForCell && 
    componentForCell.startRow === row && 
    componentForCell.startCol === col;

  // Determine if we should render a component in this cell
  const shouldRenderComponent = isStartCell;

  return (
    <Box
      ref={drop}
      sx={{
        position: 'relative',
        border: '1px dashed #ccc',
        backgroundColor: isOver ? 'rgba(0, 0, 255, 0.1)' : 'transparent',
        gridColumn: shouldRenderComponent ? `span ${componentForCell?.colSpan}` : 'span 1',
        gridRow: shouldRenderComponent ? `span ${componentForCell?.rowSpan}` : 'span 1',
        height: '100%',
        minHeight: '50px', // Ensure consistent minimum height
      }}
    >
      {shouldRenderComponent && (
        <PlacedComponentItem 
          component={componentForCell!} 
          isSelected={selectedComponentId === componentForCell!.id}
          onSelect={() => onSelectComponent(componentForCell!.id)}
          onRemove={() => onRemoveComponent(componentForCell!.id)}
        />
      )}
    </Box>
  );
};

interface DashboardLayoutEditorProps {
  availableComponents: DashboardComponent[];
  placedComponents: PlacedComponent[];
  selectedComponentId: string | null;
  onAddComponent: (component: DashboardComponent, row: number, col: number) => void;
  onMoveComponent: (id: string, row: number, col: number) => void;
  onSelectComponent: (id: string | null) => void;
  onRemoveComponent: (id: string) => void;
  onUpdateComponentSettings?: (id: string, settings: any) => void;
}

const DashboardLayoutEditor: React.FC<DashboardLayoutEditorProps> = ({
  availableComponents,
  placedComponents,
  selectedComponentId,
  onAddComponent,
  onMoveComponent,
  onSelectComponent,
  onRemoveComponent,
  onUpdateComponentSettings
}) => {
  // State to track the component settings during edit
  const [componentSettings, setComponentSettings] = useState<any>({});
  const { t, i18n } = useTranslation('agents');
  // Set up keyboard event handler for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedComponentId) return;

      // Only process arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      e.preventDefault(); // Prevent page scrolling

      const selectedComponent = placedComponents.find(comp => comp.id === selectedComponentId);
      if (!selectedComponent) return;

      let newRow = selectedComponent.startRow;
      let newCol = selectedComponent.startCol;

      // Calculate new position based on key pressed
      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, newRow - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(7 - selectedComponent.rowSpan + 1, newRow + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, newCol - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(11 - selectedComponent.colSpan + 1, newCol + 1);
          break;
      }

      // Only move if position changed
      if (newRow !== selectedComponent.startRow || newCol !== selectedComponent.startCol) {
        console.log(`Moving component with arrow key: ${e.key} to position (${newRow}, ${newCol})`);
        onMoveComponent(selectedComponentId, newRow, newCol);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponentId, placedComponents, onMoveComponent]);

  // Update componentSettings when the selected component changes
  useEffect(() => {
    if (selectedComponentId) {
      const selectedComponent = placedComponents.find(comp => comp.id === selectedComponentId);
      if (selectedComponent) {
        setComponentSettings(selectedComponent.settings || {});
      }
    }
  }, [selectedComponentId, placedComponents]);

  // Handle settings change
  const handleSettingsChange = (newSettings: any) => {
    setComponentSettings(newSettings);
    if (selectedComponentId && onUpdateComponentSettings) {
      onUpdateComponentSettings(selectedComponentId, newSettings);
    }
  };

  // Create grid cells for the layout
  const gridCells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 12; col++) {
      // Skip cells that would be covered by components that start in previous cells
      const isCovered = placedComponents.some(comp => 
        row >= comp.startRow && 
        row < comp.startRow + comp.rowSpan &&
        col >= comp.startCol && 
        col < comp.startCol + comp.colSpan &&
        !(comp.startRow === row && comp.startCol === col) // not the start cell
      );

      if (!isCovered) {
        gridCells.push(
          <GridCell 
            key={`${row}-${col}`} 
            row={row} 
            col={col} 
            placedComponents={placedComponents}
            onAddComponent={onAddComponent}
            onMoveComponent={onMoveComponent}
            selectedComponentId={selectedComponentId}
            onSelectComponent={onSelectComponent}
            onRemoveComponent={onRemoveComponent}
          />
        );
      }
    }
  }

  // Find the selected component
  const selectedComponent = placedComponents.find(comp => comp.id === selectedComponentId);

  // Determine which component renderer to use for settings
  const getComponentType = (componentName: string): React.ComponentType<any> | null => {
    // First check in the map
    if (COMPONENT_MAP[componentName]) {
      return COMPONENT_MAP[componentName];
    }

    // Try with 'Tile' prefix if not found
    if (COMPONENT_MAP[`Tile${componentName}`]) {
      return COMPONENT_MAP[`Tile${componentName}`];
    }

    // Fallback to using the react_component_name from the available components
    const availableComponent = availableComponents.find(c => c.id === selectedComponentId);
    if (availableComponent?.react_component_name && COMPONENT_MAP[availableComponent.react_component_name]) {
      return COMPONENT_MAP[availableComponent.react_component_name];
    }

    return null;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Grid container spacing={3}>
        {/* Component List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Available Components</Typography>
            <List sx={{ maxHeight: '500px', overflow: 'auto' }}>
              {availableComponents.map((component) => (
                <ListItem key={component.id} disablePadding sx={{ mb: 1 }}>
                  <DraggableComponent component={component} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Layout Grid */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Layout Grid (12x8)</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gridTemplateRows: 'repeat(8, minmax(50px, auto))', // Define explicit row heights
                gap: 1,
                border: '1px solid #eee',
                p: 1,
                minHeight: '500px',
                height: 'auto',
                aspectRatio: '1.5',
              }}
            >
              {gridCells}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Component Properties */}
      <Paper sx={{ p: 0, mt: 3 }}>
        {selectedComponent ? (
          <Box>
            <Typography variant="h6" sx={{ p: 1,pl:2, mb: 0, pb: 0 }}>
              {t('agents.dashboards.' + selectedComponent.name)} ({selectedComponent.type})
            </Typography>
            <Divider sx={{ my: 1 }} />

            {/* Render the component's settings form */}
            {(() => {
              // Find the component type first
              const componentType = getComponentType(selectedComponent.name);

              if (componentType) {
                const ComponentSettings = componentType;
                return (
                  <ComponentSettings
                    settings={componentSettings}
                    renderMode="settings"
                    onSettingsChange={handleSettingsChange}
                  />
                );
              } else {
                return (
                  <Typography color="text.secondary">
                    Settings not available for this component type.
                  </Typography>
                );
              }
            })()}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ padding: '20px'}}>
            Select a component to view and edit its properties
          </Typography>
        )}
      </Paper>
    </DndProvider>
  );
};

export default DashboardLayoutEditor;