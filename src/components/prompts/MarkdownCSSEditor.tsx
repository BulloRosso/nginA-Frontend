
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Box
} from '@mui/material';
import Editor from '@monaco-editor/react';

interface MarkdownCSSEditorProps {
  open: boolean;
  onClose: () => void;
  initialCSS: string;
  onSave: (css: string) => void;
}

const MarkdownCSSEditor: React.FC<MarkdownCSSEditorProps> = ({
  open,
  onClose,
  initialCSS,
  onSave
}) => {
  const [css, setCSS] = useState<string>(initialCSS || '');
  const [cssChanged, setCssChanged] = useState<boolean>(false);
  const [defaultCSS, setDefaultCSS] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Load default CSS from file
  useEffect(() => {
    const loadDefaultCSS = async () => {
      try {
        setLoading(true);
        const response = await fetch('/src/components/prompts/markdown.css');
        if (response.ok) {
          const cssText = await response.text();
          setDefaultCSS(cssText);
        } else {
          console.warn('Failed to load default markdown CSS file:', response.status);
        }
      } catch (error) {
        console.error('Error loading default markdown CSS:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && !defaultCSS) {
      loadDefaultCSS();
    }
  }, [open, defaultCSS]);

  // Update css when initialCSS changes
  useEffect(() => {
    if (initialCSS) {
      setCSS(initialCSS);
      setCssChanged(false);
    }
  }, [initialCSS, open]);

  const handleSave = () => {
    onSave(css);
    // Save to localStorage directly here too, for redundancy
    localStorage.setItem('markdownCSS', css);
    setCssChanged(false);
    onClose();
  };

  const handleReset = () => {
    setCSS(defaultCSS);
    setCssChanged(true);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCSS(value);
      setCssChanged(true);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>
        <Typography component="div" variant="h6">
          Customize Markdown CSS
          <Typography variant="subtitle1" color="textSecondary" component="div">
            Customize the appearance of your markdown preview
          </Typography>
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading default CSS styles...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <Typography variant="h6" gutterBottom>CSS Editor</Typography>
              <Editor
                height="90%"
                defaultLanguage="css"
                theme="light"
                value={css}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>Preview</Typography>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '90%', 
                  overflow: 'auto',
                  bgcolor: 'background.default'
                }}
              >
                <style>{css}</style>
                <div className="markdown-preview">
                  <h1>Heading 1</h1>
                  <h2>Heading 2</h2>
                  <h3>Heading 3</h3>
                  <h4>Heading 4</h4>
                  <h5>Heading 5</h5>
                  <h6>Heading 6</h6>

                  <p>This is a paragraph with <strong>bold</strong>, <em>italic</em>, and <code>inline code</code> text.</p>

                  <blockquote>
                    <p>This is a blockquote with a paragraph inside it.</p>
                  </blockquote>

                  <p>Here's a code block:</p>
                  <pre>Some Code</pre>

                  <p>An unordered list:</p>
                  <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3 with nested items
                      <ul>
                        <li>Nested item 1</li>
                        <li>Nested item 2</li>
                      </ul>
                    </li>
                  </ul>

                  <p>An ordered list:</p>
                  <ol>
                    <li>First item</li>
                    <li>Second item</li>
                    <li>Third item</li>
                  </ol>

                  <p>A table:</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Header 1</th>
                        <th>Header 2</th>
                        <th>Header 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Cell 1-1</td>
                        <td>Cell 1-2</td>
                        <td>Cell 1-3</td>
                      </tr>
                      <tr>
                        <td>Cell 2-1</td>
                        <td>Cell 2-2</td>
                        <td>Cell 2-3</td>
                      </tr>
                    </tbody>
                  </table>

                  <p>A <a href="#">link</a> to somewhere.</p>
                </div>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
       
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!cssChanged || loading}
        >
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarkdownCSSEditor;