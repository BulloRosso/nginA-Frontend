// src/components/memories/EditMemoryDialog.tsx
import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography
} from '@mui/material';
import { Memory, Category, Location } from '../../types/memory';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useTranslation } from 'react-i18next';
// Import date locale adapters for each supported language
import { de, enUS } from 'date-fns/locale';

interface EditMemoryDialogProps {
  open: boolean;
  memory: Memory | null;
  onClose: () => void;
  onSave: (updatedMemory: Partial<Memory>) => Promise<void>;
}

const localeMap = {
  'de': de,
  'en': enUS,
};

const EditMemoryDialog: React.FC<EditMemoryDialogProps> = ({
  open,
  memory,
  onClose,
  onSave
}) => {
  const { t, i18n } = useTranslation(['memory', 'common']);

  // Get the appropriate locale based on current language
  const dateLocale = React.useMemo(() => {
    console.log("Current language:", i18n.language);
    return localeMap[i18n.language as keyof typeof localeMap] || enUS;
  }, [i18n.language]);

  // Add debug logging
  React.useEffect(() => {
    console.log("Current language:", i18n.language);
    console.log("Memory namespace:", t('memory:edit_dialog', { returnObjects: true }));
    console.log("Test translation:", t('memory:edit_dialog.title'));
  }, [i18n.language, t]);

  // Initialize state with default values
  const [category, setCategory] = React.useState<Category>(Category.CHILDHOOD);
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState<Date>(new Date());
  const [loading, setLoading] = React.useState(false);
  const [caption, setCaption] = React.useState(''); 
  const [location, setLocation] = React.useState<Location>({
    name: '',
    city: '',
    country: '',
    description: ''
  });

  // Update state when memory changes
  React.useEffect(() => {
    if (memory) {
      setCategory(memory.category);
      setCaption(memory.caption || ''); 
      setDescription(memory.description || '');
      setDate(new Date(memory.timePeriod));
      setLocation({
        name: memory.location?.name || '',
        city: memory.location?.city || '',
        country: memory.location?.country || '',
        description: memory.location?.description || ''
      });
    }
  }, [memory]);

  const handleDateChange = (newDate: Date | null) => {
    console.log('Date changed:', newDate);
    setDate(newDate || new Date());
  };

  
  const handleSave = async () => {
    if (!memory) return;

    try {
      setLoading(true);

      // Log the date state and its ISO string
      console.log('Current date state:', date);
      console.log('Date as ISO string:', date.toISOString());

      const updateData = {
        id: memory.id,
        category,
        caption,
        description,
        time_period: date.toISOString(),  // snake_case for backend
        location: {
          name: location.name || '',
          city: location.city || '',
          country: location.country || '',
          description: location.description || ''
        }
      };

      // Log the complete update data
      console.log('Memory update data being sent:', updateData);

      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error('Failed to update memory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    if (memory) {
      setCategory(memory.category);
      setCaption(memory.caption || '');
      setDescription(memory.description || '');
      setDate(new Date(memory.timePeriod));
      setLocation({
        name: memory.location?.name || '',
        city: memory.location?.city || '',
        country: memory.location?.country || '',
        description: memory.location?.description || ''
      });
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>{t('memory.edit_dialog.title')}</DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-4">
          <FormControl fullWidth>
            <InputLabel>{t('memory.edit_dialog.category')}</InputLabel>
            <Select
              value={category}
              label={t('memory.edit_dialog.category')}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.values(Category).map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {t(`common.categories.${cat.toLowerCase()}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('memory.edit_dialog.caption')}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('memory.edit_dialog.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <LocalizationProvider 
            dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
            <DatePicker
              label={t('memory.edit_dialog.date')}
              value={date}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <Typography variant="h6" className="mt-4 mb-2">
            {t('memory.edit_dialog.location.title')}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('memory.edit_dialog.location.name')}
                value={location.name}
                onChange={(e) => setLocation({ ...location, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('memory.edit_dialog.location.city')}
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('memory.edit_dialog.location.country')}
                value={location.country}
                onChange={(e) => setLocation({ ...location, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('memory.edit_dialog.location.description')}
                value={location.description}
                onChange={(e) => setLocation({ ...location, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {t('memory.edit_dialog.buttons.cancel')}
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          {t('memory.edit_dialog.buttons.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMemoryDialog;