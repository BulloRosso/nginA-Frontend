// src/components/agents/tabs/InputFormForSchema.tsx
import React, { useState, useEffect } from 'react';
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
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    if (!schema.required) {
      setIsFormValid(true);
      return;
    }

    // Check if all required fields have values
    const requiredFieldsHaveValues = schema.required.every(field => {
      const value = getValueByPath(formData, field);
      return value !== undefined && value !== '';
    });

    setIsFormValid(requiredFieldsHaveValues);
  };

  const handleReset = () => {
    setFormData({});
    setExpandedItems({});
  };

  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      const parts = path.split('.');

      // Handle the last part separately to set the value
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

  // This is a helper function to determine if a field should be rendered
  // based on its schema. We want to render leaf nodes only.
  const shouldRenderAsInputField = (fieldSchema) => {
    // If it's not an object type or it's an object without properties, render it as input
    if (fieldSchema.type !== 'object' || !fieldSchema.properties) {
      return true;
    }

    // For objects with a "type" and "description" property, check if it's a special case
    // from your example (representing a single value with metadata)
    if (
      Object.keys(fieldSchema.properties).length === 2 &&
      fieldSchema.properties.type && 
      fieldSchema.properties.description
    ) {
      return true;
    }

    // Otherwise, render as nested object
    return false;
  };

  const renderField = (fieldSchema, path, parentRequired = []) => {
    // Skip if no schema
    if (!fieldSchema) return null;

    const pathParts = path.split('.').filter(p => p !== '');
    const fieldName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
    const isRequired = schema.required?.includes(fieldName) || parentRequired.includes(fieldName);

    // Handle special case for objects with type and description properties
    // as shown in the example schema
    if (
      fieldSchema.type === 'object' && 
      fieldSchema.properties &&
      fieldSchema.properties.type &&
      fieldSchema.properties.description
    ) {
      // Extract the actual type and description
      const actualType = fieldSchema.properties.type?.description || '';
      const description = fieldSchema.properties.description?.description || '';
      const fieldLabel = fieldName;

      return (
        <Box sx={{ mb: 2 }}>
          <TextField
            required={isRequired}
            fullWidth
            label={fieldLabel}
            placeholder={description}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            value={getValueByPath(formData, fieldName) || ''}
            margin="none"
            size="small"
            sx={{ backgroundColor: 'white', borderRadius: 1 }}
            variant="outlined"
            type={actualType === 'number' ? 'number' : 'text'}
          />
          {description && (
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
              {description}
            </Typography>
          )}
        </Box>
      );
    }

    // Handle regular field types
    switch (fieldSchema.type) {
      case 'string':
        return (
          <Box sx={{ mb: 2 }}>
            <TextField
              required={isRequired}
              fullWidth
              label={fieldSchema.title || fieldName}
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
              label={fieldSchema.title || fieldName}
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
        if (!fieldSchema.properties) return null;

        return (
          <Box sx={{ mb: 2 }}>
            {Object.entries(fieldSchema.properties).map(([key, prop]) => (
              <div key={key}>
                {renderField(prop, path ? `${path}.${key}` : key, fieldSchema.required || [])}
              </div>
            ))}
          </Box>
        );

      case 'array':
        const arrayValue = getValueByPath(formData, path) || [];
        const arrayTitle = fieldSchema.title || fieldName;

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
    const parts = path.split('.').filter(part => part !== '');
    return parts.reduce((current, part) => {
      return current?.[part];
    }, obj);
  };

  const handleSubmitData = () => {
    onSubmit(formData);
  };

  const notEmpty = (obj) => {
    return Object.entries(obj).length > 0;
  };

  return (
    <Box style={{ width: '100%', maxWidth: '1000px', margin: '0', paddingTop: '10px' }}>
      {Object.entries(schema.properties || {}).map(([key, prop]) => (
        <div key={key}>
          {renderField(prop, key, schema.required || [])}
        </div>
      ))}

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
          type="button"
          onClick={handleSubmitData}
          disabled={isLoading || !isFormValid}
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
    </Box>
  );
};

export default SchemaForm;