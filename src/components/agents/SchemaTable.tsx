// components/agents/SchemaTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { marked } from 'marked';
import { useTheme } from '@mui/material/styles';
import DOMPurify from 'dompurify';
import { SchemaField } from '../../types/agent';

interface SchemaTableProps {
  schema: Record<string, SchemaField>;
}

const SchemaTable: React.FC<SchemaTableProps> = ({ schema }) => {
  const theme = useTheme();

  const renderMarkdown = (text: string | null | undefined) => {
    if (!text) {
      return '';  // Return empty string for null/undefined values
    }
    const rawMarkup = marked(text);
    const cleanMarkup = DOMPurify.sanitize(rawMarkup);
    return <div dangerouslySetInnerHTML={{ __html: cleanMarkup }} />;
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ color: '#999' }}>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(schema).map(([name, field], index) => (
            <TableRow
              key={name}
              sx={{
                backgroundColor: index % 2 === 0 ? 
                  'background.default' : 
                  theme.palette.action.hover
              }}
            >
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                {name}
              </TableCell>
              <TableCell>{field.type}</TableCell>
              <TableCell>
                {field.description ? renderMarkdown(field.description) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SchemaTable;