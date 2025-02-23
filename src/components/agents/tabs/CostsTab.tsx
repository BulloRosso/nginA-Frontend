import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Autocomplete, 
  TextField, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Collapse
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Agent } from '../../../types/agent';
import { TagService } from '../../../services/tags';
import { TagNode } from '../../../types/tag';
import { useTranslation } from 'react-i18next';

export const CostsTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const { t } = useTranslation(['tagging', 'agents']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [tagTree, setTagTree] = useState<TagNode[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({});

  // Helper function to translate tag display
  const translateTag = (fullTag: string): string => {
    const [category, name] = fullTag.split(':');
    if (!name) return t(`tagging.categories.${category}`);
    return t(`tagging.tags.${category}.${name}`);
  };

  // Helper function to get original tag from translated text
  const getOriginalTag = (translatedText: string): string | null => {
    for (const category of Object.keys(t('tagging.tags', { returnObjects: true }))) {
      const tags = t(`tagging.tags.${category}`, { returnObjects: true });
      for (const [key, value] of Object.entries(tags)) {
        if (value === translatedText) {
          return `${category}:${key}`;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    fetchTags();
  }, [agent.id]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const agentTags = await TagService.getAgentTags(agent.id);
      setTags(agentTags);
      setSelectedTags(agentTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = async (newValue: string[]) => {
    try {
      setLoading(true);
      await TagService.setAgentTags(agent.id, newValue);
      setTags(newValue);
    } catch (error) {
      console.error('Error updating tags:', error);
      setError('Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setInputValue(value);
    if (value.length > 1) {
      try {
        const suggestions = await TagService.getTagSuggestions(value);
        setTagSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }
  };

  const openTagDialog = async () => {
    try {
      setLoading(true);
      const tree = await TagService.getTagTree();
      console.log('Fetched tag tree:', tree);
      setTagTree(tree);
      setSelectedTags([...tags]);

      // Initialize all categories as closed
      const initialOpenState = tree.reduce((acc, node) => {
        acc[node.id] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      setOpenCategories(initialOpenState);

      setIsTagDialogOpen(true);
    } catch (error) {
      console.error('Error fetching tag tree:', error);
      setError('Failed to load tag tree');
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleDialogClose = () => {
    setIsTagDialogOpen(false);
  };

  const handleDialogConfirm = async () => {
    await handleTagChange(selectedTags);
    setIsTagDialogOpen(false);
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <Box p={0}>

      <Typography element="div">
        Endpoint:<br/> {agent.agent_endpoint}
      </Typography>
      <Typography sx={{ mt: 2 }} element="div">
        Credits per run: <b>{agent.credits_per_run}</b> Cred.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 3 }}>
        <Autocomplete
          multiple
          value={tags}
          onChange={(_, newValue) => handleTagChange(newValue)}
          inputValue={inputValue}
          onInputChange={(_, value) => handleInputChange(value)}
          options={tagSuggestions}
          filterOptions={(x) => x}
          freeSolo
          getOptionLabel={(option) => translateTag(option)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                key={option}
                label={translateTag(option)}
                {...getTagProps({ index })}
                color="primary"
                variant="outlined"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label={t('tagging.input.label')}
              placeholder={t('tagging.input.placeholder')}
              fullWidth
              disabled={loading}
            />
          )}
          sx={{ flexGrow: 1 }}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={openTagDialog}
          sx={{ alignSelf: 'center' }}
          disabled={loading}
        >
          {t('tagging.input.select_button')}
        </Button>
      </Box>

      <Dialog
        open={isTagDialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('tagging.dialog.title')}</DialogTitle>
        <DialogContent>
          {tagTree.length > 0 ? (
            <List sx={{ width: '100%' }}>
              {tagTree.map((category) => (
                <React.Fragment key={category.id}>
                  <ListItem 
                    button 
                    onClick={() => toggleCategory(category.id)}
                    sx={{ 
                      bgcolor: '#cccccc',
                      '&:hover': {
                        bgcolor: '#bebebe'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={t(`tagging.categories.${category.name}`)}
                      primaryTypographyProps={{
                        fontWeight: 'bold'
                      }}
                    />
                    {openCategories[category.id] ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  <Collapse in={openCategories[category.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {category.children.map((tag) => (
                        <ListItem 
                          key={tag.id} 
                          sx={{ pl: 4 }}
                          button
                          onClick={() => handleTagSelect(tag.full_tag)}
                        >
                          <ListItemText
                            primary={
                              <Chip
                                label={t(`tagging.tags.${tag.category}.${tag.name}`)}
                                color={selectedTags.includes(tag.full_tag) ? "primary" : "default"}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagSelect(tag.full_tag);
                                }}
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>{t('tagging.dialog.no_tags')}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>{t('tagging.dialog.cancel')}</Button>
          <Button onClick={handleDialogConfirm} variant="contained" disabled={loading}>
            {t('tagging.dialog.assign')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};