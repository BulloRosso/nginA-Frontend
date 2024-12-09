// src/components/memories/EditMemoryDialog.tsx
import React from 'react';
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

interface EditMemoryDialogProps {
  open: boolean;
  memory: Memory | null;
  onClose: () => void;
  onSave: (updatedMemory: Partial<Memory>) => Promise<void>;
}

const EditMemoryDialog: React.FC<EditMemoryDialogProps> = ({
  open,
  memory,
  onClose,
  onSave
}) => {
  const [category, setCategory] = React.useState<Category>(Category.CHILDHOOD);
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [location, setLocation] = React.useState<Location>({
    name: '',
    city: '',
    country: '',
    description: ''
  });

  React.useEffect(() => {
    if (memory) {
      setCategory(memory.category);
      setDescription(memory.description);
      setDate(new Date(memory.timePeriod));
      setLocation(memory.location || {
        name: '',
        city: '',
        country: '',
        description: ''
      });
    }
  }, [memory]);

  const handleSave = async () => {
    if (!memory) return;

    try {
      setLoading(true);
      await onSave({
        id: memory.id,
        category,
        description,
        time_period: date?.toISOString(), // Changed from timePeriod to time_period
        location: {
          name: location.name || '',
          city: location.city || '',
          country: location.country || '',
          description: location.description || ''
        }
      });
      onClose();
    } catch (error) {
      console.error('Failed to update memory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Memory</DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-4">
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.values(Category).map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <Typography variant="h6" className="mt-4 mb-2">
            Location Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name"
                value={location.name}
                onChange={(e) => setLocation({ ...location, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={location.country}
                onChange={(e) => setLocation({ ...location, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Description"
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
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMemoryDialog;