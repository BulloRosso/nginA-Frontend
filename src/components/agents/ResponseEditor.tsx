import React, { useEffect, useRef, useState } from 'react';
import { Button, Collapse, Box } from '@mui/material';
import Editor from '@monaco-editor/react';

const ResponseEditor = ({ response, onReset }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editorValue, setEditorValue] = useState('');

  // Update editor content when response changes
  useEffect(() => {
    if (response) {
      setShowEditor(true);
      setEditorValue(JSON.stringify(response, null, 2));
    } else {
      setShowEditor(false);
    }
  }, [response]);

  const handleReset = () => {
    setShowEditor(false);
    setEditorValue('');
    if (onReset) {
      onReset();
    }
  };

  const editorOptions = {
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    automaticLayout: true,
    folding: true,
    wordWrap: 'on',
    formatOnPaste: true,
  };

  return (
    <Box sx={{ mt: 0, mb: 0 }}>
      <Collapse in={showEditor} timeout={300}>
        <Box 
          sx={{
            height: '160px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Editor
            height="160px"
            defaultLanguage="json"
            value={editorValue}
            options={editorOptions}
            theme="vs-dark"
          />
        </Box>
      </Collapse>

    </Box>
  );
};

export default ResponseEditor;