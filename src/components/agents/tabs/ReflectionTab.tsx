// src/components/agents/tabs/Reflection.tsx
import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ReflectionTabProps {
  onChange?: (reflectionEnabled: boolean, reflectionPrompt: string) => void;
}

const ReflectionTab: React.FC<ReflectionTabProps> = ({ onChange }) => {
  const [reflectOnOutputs, setReflectOnOutputs] = useState<boolean>(false);
  const [reflectionPrompt, setReflectionPrompt] = useState<string>('');
  const { t } = useTranslation(['agents']);
  
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
   
    const isChecked = event.target.checked;
    setReflectOnOutputs(isChecked);

    if (onChange) {
      onChange(isChecked, reflectionPrompt);
    }
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPrompt = event.target.value;
    setReflectionPrompt(newPrompt);

    if (onChange) {
      onChange(reflectOnOutputs, newPrompt);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', margin: '0' }}>

      <Typography variant="body">
        {t('agents.reflection_description')}
      </Typography>
      <div style={{ paddingTop: '10px' }}></div>
      <FormControlLabel
        control={
          <Checkbox 
            checked={reflectOnOutputs}
            onChange={handleCheckboxChange}
          />
        }
        label="Reflect on outputs"
      />

      {reflectOnOutputs && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={reflectionPrompt}
            onChange={handlePromptChange}
            placeholder="Enter the reasoning prompt to reflect on the outputs."
            variant="outlined"
            sx={{ 
              backgroundColor: 'white', 
              borderRadius: 1 
            }}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1, 
              p: "6px", 
              color: '#666666',
              bgcolor: "#f6f4ee",
              borderRadius: 0
            }}
          >
            The reflection prompt will be executed by an LLM that has access to the response files via the tools get_response_files() and load_content(fileName). The reflection must conclude with either "Approved." or "Rejected." followed by a reason if rejected.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReflectionTab;