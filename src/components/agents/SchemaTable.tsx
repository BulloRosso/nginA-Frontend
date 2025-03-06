import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  AccountTree as TreeIcon,
  List as ListIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  Check as RequiredIcon,
  Code as ObjectIcon,
  Schema as RefIcon,
  Rule as PatternIcon,
  AllInclusive as AllOfIcon,
  CallSplit as OneOfIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTheme } from '@mui/material/styles';
import { JSONSchemaDefinition } from '../../types/agent';

interface SchemaTableProps {
  schema: JSONSchemaDefinition;
  level?: number;
  parentRefs?: Set<string>;
}

const getTypeIcon = (schema: JSONSchemaDefinition) => {
  if (schema.$ref) return <RefIcon color="info" />;
  if (schema.allOf) return <AllOfIcon color="info" />;
  if (schema.oneOf || schema.anyOf) return <OneOfIcon color="info" />;

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'object': return <ObjectIcon color="info" />;
    case 'array': return <ListIcon color="success" />;
    case 'string': return <TextIcon color="secondary" />;
    case 'number':
    case 'integer': return <NumberIcon color="warning" />;
    default: return <TreeIcon color="action" />;
  }
};

const getTypeLabel = (schema: JSONSchemaDefinition) => {
  if (schema.$ref) return 'ref';
  if (schema.allOf) return 'allOf';
  if (schema.oneOf) return 'oneOf';
  if (schema.anyOf) return 'anyOf';
  return Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
};

const getConstraints = (schema: JSONSchemaDefinition): string[] => {
  const constraints: string[] = [];

  if (schema.pattern) constraints.push(`pattern: ${schema.pattern}`);
  if (schema.format) constraints.push(`format: ${schema.format}`);
  if (schema.enum) constraints.push(`enum: [${schema.enum.join(', ')}]`);
  if (schema.minimum !== undefined) constraints.push(`min: ${schema.minimum}`);
  if (schema.maximum !== undefined) constraints.push(`max: ${schema.maximum}`);
  if (schema.minLength !== undefined) constraints.push(`minLength: ${schema.minLength}`);
  if (schema.maxLength !== undefined) constraints.push(`maxLength: ${schema.maxLength}`);
  if (schema.minItems !== undefined) constraints.push(`minItems: ${schema.minItems}`);
  if (schema.maxItems !== undefined) constraints.push(`maxItems: ${schema.maxItems}`);

  return constraints;
};

const resolveRef = (ref: string, rootSchema: JSONSchemaDefinition): JSONSchemaDefinition | null => {
  const path = ref.replace('#/', '').split('/');
  let current: any = rootSchema;

  for (const segment of path) {
    if (current.$defs && segment in current.$defs) {
      current = current.$defs[segment];
    } else if (current.properties && segment in current.properties) {
      current = current.properties[segment];
    } else {
      return null;
    }
  }

  return current;
};

// Helper function to get the first property name of an object
const getFirstPropertyName = (schema: JSONSchemaDefinition): string | null => {
  if (schema.type === 'object' && schema.properties) {
    const firstKey = Object.keys(schema.properties)[0];
    return firstKey || null;
  }
  return null;
};

const SchemaTable: React.FC<SchemaTableProps> = ({ 
  schema, 
  level = 0,
  parentRefs = new Set()
}) => {
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);
  const theme = useTheme();

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy schema:', err);
    }
  };

  const renderMarkdown = (text: string | undefined) => {
    if (!text) return '';
    const rawMarkup = marked(text);
    const cleanMarkup = DOMPurify.sanitize(rawMarkup);
    return <div dangerouslySetInnerHTML={{ __html: cleanMarkup }} />;
  };

  const renderSchemaRow = (
    name: string,
    schemaObj: JSONSchemaDefinition,
    required: boolean = false,
    parentPath = ''
  ) => {
    const currentPath = parentPath ? `${parentPath}.${name}` : name;
    const constraints = getConstraints(schemaObj);
    const backgroundColor = theme.palette.grey[level % 2 === 0 ? 100 : 50];

    return (
      <React.Fragment key={currentPath}>
         { schemaObj.type != 'object' && (
        <TableRow sx={{ backgroundColor }}>
         
          <TableCell sx={{ 
              pl: 1 
            }}>
            <Box sx={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography>
                <code>{name}</code>
              </Typography>
              <span>
                {required && (
                  <RequiredIcon 
                    fontSize="small" 
                    sx={{ ml: 0.5, color: theme.palette.error.main }} 
                  />
                )}
              </span>
            </Box>
          </TableCell>
          <TableCell sx={{ backgroundColor: 'white'}}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={getTypeLabel(schemaObj)}
                size="small"
                sx={{ fontFamily: 'monospace' }}
              />
              {constraints.map((constraint, i) => (
                <Tooltip key={i} title={constraint}>
                  <PatternIcon fontSize="small" color="action" />
                </Tooltip>
              ))}
            </Box>
          </TableCell>
          <TableCell sx={{ backgroundColor: 'white'}}>{renderMarkdown(schemaObj.description)}</TableCell>
            
        </TableRow>
        )}
        {/* Handle nested content */}
        {renderNestedContent(schemaObj, currentPath, level)}
      </React.Fragment>
    );
  };

  const renderNestedContent = (
    schemaObj: JSONSchemaDefinition,
    currentPath: string,
    level: number
  ) => {
    // Handle $ref
    if (schemaObj.$ref && !parentRefs.has(schemaObj.$ref)) {
      return (
        <TableRow>
          <TableCell colSpan={3} sx={{ p: 0 }}>
            <Box sx={{ pl: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Referenced schema ({schemaObj.$ref}):
              </Typography>
              <SchemaTable 
                schema={resolveRef(schemaObj.$ref, schema) || {}}
                level={level + 1}
                parentRefs={new Set([...parentRefs, schemaObj.$ref])}
              />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    // Handle nested object properties
    if (schemaObj.type === 'object' && schemaObj.properties) {
      return Object.entries(schemaObj.properties).map(([propName, propSchema]) => 
        renderSchemaRow(
          propName, 
          propSchema, 
          schemaObj.required?.includes(propName),
          currentPath
        )
      );
    }

    // Handle array items
    if (schemaObj.type === 'array' && schemaObj.items) {
      const itemSchema = Array.isArray(schemaObj.items) ? schemaObj.items[0] : schemaObj.items;
      const typeName = getFirstPropertyName(itemSchema);

      return (
        <TableRow>
          <TableCell colSpan={3} sx={{ p: 0, backgroundColor: '#f7f0db' }}>
            <Box sx={{ pl: 2 }}>
              {typeName && itemSchema.type === 'object' && (
              <>
                <Typography variant="h6" sx={{ ml: 1, my: 1 }}>
                  {typeName}
               
                <Chip 
                  label="object"
                  size="small"
                  sx={{  marginLeft: '8px', fontFamily: 'monospace' }}
                /> 
               
                </Typography>
               
              </>
              )}
              <SchemaTable 
                schema={itemSchema}
                level={level + 1}
                parentRefs={parentRefs}
              />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    // Handle allOf, oneOf, anyOf
    if (schemaObj.allOf || schemaObj.oneOf || schemaObj.anyOf) {
      return (
        <TableRow>
          <TableCell colSpan={3} sx={{ p: 0 }}>
            <Box sx={{ pl: 4 }}>
              {(schemaObj.allOf || schemaObj.oneOf || schemaObj.anyOf)?.map((subSchema, idx) => (
                <Box key={idx}>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    {schemaObj.allOf ? 'Must match all:' : 'Must match one:'}
                  </Typography>
                  <SchemaTable 
                    schema={subSchema}
                    level={level + 1}
                    parentRefs={parentRefs}
                  />
                </Box>
              ))}
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return null;
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ my: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schema.properties && 
              Object.entries(schema.properties).map(([name, fieldSchema]) =>
                renderSchemaRow(name, fieldSchema, schema.required?.includes(name))
              )}
            {!schema.properties && renderSchemaRow('root', schema)}
          </TableBody>
        </Table>
      </TableContainer>

      {level === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
          <Tooltip title="Copy JSON Schema">
            <IconButton onClick={handleCopySchema} size="small">
              {copySuccess ? <CheckIcon color="success" /> : <CopyIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="Schema copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default SchemaTable;