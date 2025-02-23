import React, { useState } from 'react';
import {
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Collapse,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const SchemaForm = ({ schema, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  const handleReset = () => {
    setFormData({});
    setExpandedItems({});
  }
  
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

      setExpandedItems(prevExpanded => ({
        ...prevExpanded,
        [`${path}.${current.length - 1}`]: true
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
    const isRequired = schema.required?.includes(path.split('.').pop());
    const fieldLabel = `${fieldSchema.title || path.split('.').pop()}`;

    switch (fieldSchema.type) {
      case 'string':
        return (
          <Box sx={{ mb: 2 }}>
            <TextField
              required={isRequired}
              fullWidth
              label={fieldLabel}
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
                  color: '#666666',
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
      case 'integer':
        return (
          <Box sx={{ mb: 2 }}>
            <TextField
              required={isRequired}
              fullWidth
              type="number"
              label={fieldLabel}
              onChange={(e) => {
                const value = fieldSchema.type === 'integer' 
                  ? parseInt(e.target.value)
                  : parseFloat(e.target.value);
                handleChange(path, value);
              }}
              value={getValueByPath(formData, path) || ''}
              margin="none"
              size="small"
              sx={{ backgroundColor: 'white', borderRadius: 1 }}
              variant="outlined"
              inputProps={{
                step: fieldSchema.type === 'integer' ? 1 : 'any'
              }}
            />
            {fieldSchema.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0, 
                  p: "6px", 
                  color: '#666666',
                  bgcolor: "#f6f4ee",
                  borderRadius: 0
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
                    {renderField(fieldSchema.items, `${path}.${index}`)}
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
    if (!path) return obj;
    return path.split('.').reduce((current, part) => {
      return current?.[part];
    }, obj);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const notEmpty = (obj) => {
    return Object.entries(obj).length > 0
  };
  

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '1000px', margin: '0', paddingTop: '10px' }}>
      {renderField(schema, '')}
      
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flex: 1
      }}>
        {notEmpty(formData) && (
          <Button 
            variant="outlined"
            color="secondary"
            onClick={handleReset}
          >
            Reset
          </Button>
        )}
      <Box>
      </Box>
        <Button 
          variant="contained" 
          type="submit"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            backgroundColor: 'gold',
            '&:hover': {
              backgroundColor: '#DAA520', // Darker gold (goldenrod)
            },
            '&:disabled': {
              backgroundColor: 'rgba(218, 165, 32, 0.5)', // Semi-transparent goldenrod
            }
          }}
        >
          Call Agent
        </Button>
      </Box>
    </form>
  );
};

export default SchemaForm;