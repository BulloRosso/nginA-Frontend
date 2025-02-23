import React, { useState } from 'react';
import {
  CardContent,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Collapse
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const SchemaForm = ({ schema, onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      const parts = path.split('.');
      const last = parts.pop();

      for (const part of parts) {
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }

      current[last] = value;
      return newData;
    });
  };

  const handleArrayAdd = (path) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      const parts = path.split('.');

      for (const part of parts) {
        if (!(part in current)) {
          current[part] = [];
        }
        current = current[part];
      }

      if (!Array.isArray(current)) {
        current = [];
      }

      current.push({});

      // Auto-expand newly added item
      const newIndex = current.length - 1;
      setExpandedItems(prevExpanded => ({
        ...prevExpanded,
        [`${path}.${newIndex}`]: true
      }));

      return newData;
    });
  };

  const handleArrayRemove = (path, index) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      const parts = path.split('.');

      for (const part of parts) {
        current = current[part];
      }

      current.splice(index, 1);
      return newData;
    });
  };

  const toggleExpand = (path) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderField = (fieldSchema, path) => {
    switch (fieldSchema.type) {
      case 'string':
        return (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={fieldSchema.title || path.split('.').pop()}
              onChange={(e) => handleChange(path, e.target.value)}
              value={getValueByPath(formData, path) || ''}
              margin="none"
              size="small"
              sx={{ backgroundColor: 'white', borderRadius: 1 }}
              variant="outlined"
            />
            {fieldSchema.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0, 
                  p: "6px", 
                  color: '#999999',
                  bgcolor: "#f6f4ee",
                  borderRadius: 0
                }}
              >
                {fieldSchema.description}
              </Typography>
            )}
          </Box>
        );

      case 'number':
        return (
          <Box sx={{ mb: 2, width: '50%' }}>
            <TextField
              fullWidth
              type="number"
              label={fieldSchema.title || path.split('.').pop()}
              onChange={(e) => handleChange(path, parseFloat(e.target.value))}
              value={getValueByPath(formData, path) || ''}
              margin="none"
              size="small"
              variant="outlined"
            />
            {fieldSchema.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0.5, 
                  p: "6px", 
                  bgcolor: "#f6f4ee",
                  borderRadius: 1
                }}
              >
                {fieldSchema.description}
              </Typography>
            )}
          </Box>
        );

      case 'object':
        return (
          <Box sx={{ mb: 2 }}>
            
            {Object.entries(fieldSchema.properties).map(([key, prop]) => (
              <div key={key}>
                {renderField(prop, `${path}.${key}`)}
              </div>
            ))}
          </Box>
        );

      case 'array':
        const arrayValue = getValueByPath(formData, path) || [];
        const arrayTitle = fieldSchema.title || path.split('.').pop();
        return (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                {arrayTitle}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => handleArrayAdd(path)}
                startIcon={<AddIcon />}
                size="small"
              >
                Add Item
              </Button>
            </Box>
            {arrayValue.map((_, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: 1,
                  bgcolor: '#ede1bf',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: "1px 8px",
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleExpand(`${path}.${index}`)}
                >
                  <Typography sx={{ paddingLeft: '8px', marginTop: '8px'}}>
                    {`${arrayTitle} Item ${index + 1}`}
                  </Typography>
                  <Box sx={{ marginTop: '8px'}}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArrayRemove(path, index);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        transform: expandedItems[`${path}.${index}`] ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Collapse in={expandedItems[`${path}.${index}`]}>
                  <Box sx={{ p: 1 }}>
                    {index === 0 && Object.entries(fieldSchema.items.properties).map(([key, prop], idx) => (
                      <div key={key}>
                        {renderField(prop, `${path}.${index}.${key}`)}
                      </div>
                    ))}
                    {index > 0 && renderField(fieldSchema.items, `${path}.${index}`)}
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        );

      default:
        return null;
    }
  };

  const getValueByPath = (obj, path) => {
    return path.split('.').reduce((current, part) => {
      return current?.[part];
    }, obj);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
      {renderField(schema, '')}
      <Button 
        variant="contained" 
        type="submit"
        sx={{ mt: 2 }}
      >
        Submit
      </Button>
    </form>
  );
};

export default SchemaForm;