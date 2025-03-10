import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Paper
} from '@mui/material';
import Editor from '@monaco-editor/react';

interface MarkdownCSSEditorProps {
  open: boolean;
  onClose: () => void;
  initialCSS: string;
  onSave: (css: string) => void;
}

const DEFAULT_CSS = `
/* Default Markdown Styling */
h1, h2, h3, h4, h5, h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}
h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: #6a737d; }

p, blockquote, ul, ol, dl, table, pre {
  margin-top: 0;
  margin-bottom: 16px;
}

blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

ul, ol {
  padding-left: 2em;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

pre {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

pre code {
  background-color: transparent;
  padding: 0;
}

a {
  color: #0366d6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

table {
  border-collapse: collapse;
  width: 100%;
  overflow: auto;
}

table th, table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

img {
  max-width: 100%;
  box-sizing: border-box;
}
`.trim();

const MarkdownCSSEditor: React.FC<MarkdownCSSEditorProps> = ({
  open,
  onClose,
  initialCSS,
  onSave
}) => {
  const [css, setCSS] = useState<string>(initialCSS || DEFAULT_CSS);

  // Update css when initialCSS changes
  useEffect(() => {
    if (initialCSS) {
      setCSS(initialCSS);
    }
  }, [initialCSS]);

  const handleSave = () => {
    onSave(css);
    onClose();
  };

  const handleReset = () => {
    setCSS(DEFAULT_CSS);
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
        Customize Markdown CSS
        <Typography variant="subtitle1" color="textSecondary">
          Customize the appearance of your markdown preview
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={12} md={6} sx={{ height: '100%' }}>
            <Typography variant="h6" gutterBottom>CSS Editor</Typography>
            <Editor
              height="90%"
              defaultLanguage="css"
              theme="light"
              value={css}
              onChange={(value) => value !== undefined && setCSS(value)}
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
                <pre></pre>

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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="secondary">
          Reset to Default
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarkdownCSSEditor;