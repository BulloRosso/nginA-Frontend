// src/components/dashboards/TableBasedDashboardRenderer.tsx
import React from 'react';
import { Box, Typography, Skeleton, Paper } from '@mui/material';
import { DashboardConfiguration, ConfigurationComponent } from '../../types/dashboard';

// Dynamic component loader
const ComponentLoader = React.lazy(() => import('./ComponentLoader'));

interface DashboardRendererProps {
  dashboardId: string;
  configuration: DashboardConfiguration;
  isLoading: boolean;
  error: string | null;
}

const TableBasedDashboardRenderer: React.FC<DashboardRendererProps> = ({
  dashboardId,
  configuration,
  isLoading,
  error
}) => {
  if (isLoading) {
    return <Skeleton variant="rectangular" width="100%" height="100%" />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!configuration || !configuration.components || configuration.components.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No components configured for this dashboard.</Typography>
      </Box>
    );
  }

  // Determine the grid dimensions
  const determineGridDimensions = () => {
    const components = configuration.components || [];
    let maxRow = 0;
    let maxCol = 0;

    components.forEach(component => {
      const endRow = component.startRow + (component.layout_rows || 1);
      const endCol = component.startCol + (component.layout_cols || 1);

      maxRow = Math.max(maxRow, endRow);
      maxCol = Math.max(maxCol, endCol);
    });

    return { rows: maxRow, cols: maxCol };
  };

  const { rows, cols } = determineGridDimensions();

  // Create a 2D grid to represent the table
  const buildGridMatrix = () => {
    // Initialize the grid with null values
    const grid: (ConfigurationComponent | null)[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    // Place components in the grid
    (configuration.components || []).forEach(component => {
      const startRow = component.startRow;
      const startCol = component.startCol;
      const rowSpan = component.layout_rows || 1;
      const colSpan = component.layout_cols || 1;

      // Mark the starting position with the component
      grid[startRow][startCol] = component;

      // Mark all other covered cells as occupied (with undefined)
      for (let r = startRow; r < startRow + rowSpan; r++) {
        for (let c = startCol; c < startCol + colSpan; c++) {
          if (r !== startRow || c !== startCol) {
            grid[r][c] = undefined; // Occupied but not the component origin
          }
        }
      }
    });

    return grid;
  };

  const gridMatrix = buildGridMatrix();

  // Calculate cell width
  const calculateCellWidth = (colspan: number) => {
    const totalCols = cols;
    const percentage = (colspan / totalCols) * 100;
    return `${percentage}%`;
  };

  // Calculate the available height
  const calculateRowHeight = () => {
    // Calculate total rows in the dashboard
    const rowCount = rows;
    // Set a base height per row (can be adjusted)
    const baseRowHeight = `calc((100vh - 150px) / ${rowCount})`;
    return baseRowHeight;
  };

  const rowHeight = calculateRowHeight();

  return (
    <Box sx={{ 
      p: 2, 
      width: '100%', 
      height: '100%', 
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <table style={{ 
        width: '100%', 
        height: '100%',
        borderCollapse: 'collapse', 
        tableLayout: 'fixed'
      }}>
        <tbody style={{ height: '100%' }}>
          {gridMatrix.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} style={{ height: rowHeight }}>
              {row.map((cell, colIndex) => {
                // Skip rendering if the cell is occupied (undefined)
                if (cell === undefined) return null;

                // Render an empty cell if there's no component
                if (cell === null) {
                  return <td key={`cell-${rowIndex}-${colIndex}`}></td>;
                }

                // Calculate colSpan and rowSpan
                const colSpan = cell.layout_cols || 1;
                const rowSpan = cell.layout_rows || 1;

                // Special case: full-height component
                const isFullHeight = cell.type === 'full-height';

                return (
                  <td 
                    key={`cell-${rowIndex}-${colIndex}`} 
                    colSpan={colSpan} 
                    rowSpan={rowSpan}
                    style={{ 
                      width: calculateCellWidth(colSpan),
                      height: isFullHeight ? '100%' : undefined,
                      padding: '8px',
                      verticalAlign: 'top'
                    }}
                  >
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        height: '100%', 
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <React.Suspense fallback={<Skeleton variant="rectangular" width="100%" height="100%" />}>
                        <ComponentLoader 
                          component={cell} 
                          dashboardId={dashboardId}
                          fullHeight={isFullHeight}
                        />
                      </React.Suspense>
                    </Paper>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default TableBasedDashboardRenderer;