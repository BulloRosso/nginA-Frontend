// src/components/memories/VerticalTimeline.tsx
import React, { useCallback } from 'react';
import { 
  VerticalTimeline, 
  VerticalTimelineElement 
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { Memory } from '../../types/memory';
import {
  School as SchoolIcon,
  Work as WorkIcon,
  FlightTakeoff as TravelIcon,
  Favorite as RelationshipsIcon,
  SportsEsports as HobbiesIcon,
  Pets as PetsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import {
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
} from '@mui/material';
import MemoryService from '../../services/memories';
import { useDropzone } from 'react-dropzone';
import EditMemoryDialog from './EditMemoryDialog';

interface TimelineProps {
  memories: Memory[];
  onMemoryDeleted?: () => void; // Callback to refresh the memories list
}

const categoryConfig = {
  childhood: {
    icon: SchoolIcon,
    color: '#FF9800',
    background: '#FFF3E0'
  },
  career: {
    icon: WorkIcon,
    color: '#2196F3',
    background: '#E3F2FD'
  },
  travel: {
    icon: TravelIcon,
    color: '#4CAF50',
    background: '#E8F5E9'
  },
  relationships: {
    icon: RelationshipsIcon,
    color: '#E91E63',
    background: '#FCE4EC'
  },
  hobbies: {
    icon: HobbiesIcon,
    color: '#9C27B0',
    background: '#F3E5F5'
  },
  pets: {
    icon: PetsIcon,
    color: '#795548',
    background: '#EFEBE9'
  }
};

const MemoryTimeline: React.FC<TimelineProps> = ({ memories, onMemoryDeleted }) => {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editingMemory, setEditingMemory] = React.useState<Memory | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedMemoryForUpload, setSelectedMemoryForUpload] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedMemoryForUpload) return;

    try {
      setIsUploading(true);
      const urls = await MemoryService.addMediaToMemory(selectedMemoryForUpload, acceptedFiles);

      if (onMemoryDeleted) {
        onMemoryDeleted(); // Refresh the memories list
      }

      setIsUploadDialogOpen(false);
    } catch (err) {
      setError('Failed to upload images');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }, [selectedMemoryForUpload, onMemoryDeleted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop
  });

  const handleEditSave = async (updatedMemory: Partial<Memory>) => {
    try {
      await MemoryService.updateMemory(updatedMemory.id!, updatedMemory);
      if (onMemoryDeleted) {
        onMemoryDeleted(); // Refresh the memories list
      }
      setEditingMemory(null);
    } catch (err) {
      setError('Failed to update memory');
      console.error(err);
    }
  };
  
  const handleDelete = async (memoryId: string) => {
    if (!memoryId) return;

    try {
      setIsDeleting(memoryId);
      setError(null);

      await MemoryService.deleteMemory(memoryId);

      // Call the callback to refresh the memories list
      if (onMemoryDeleted) {
        onMemoryDeleted();
      }
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError('Failed to delete memory. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <>
    <VerticalTimeline lineColor="#DDD">
      {memories.map((memory, index) => {
        const category = memory.category.toLowerCase();
        const config = categoryConfig[category] || categoryConfig.childhood;
        const IconComponent = config.icon;
        const isEven = index % 2 === 0;

        return (
          
          <VerticalTimelineElement
            key={memory.id}
            className={isEven ? 'vertical-timeline-element--right' : 'vertical-timeline-element--left'}
            position={isEven ? 'right' : 'left'}
            date={new Date(memory.time_period).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            iconStyle={{ background: config.color, color: '#fff' }}
            icon={<IconComponent />}
            contentStyle={{
              background: config.background,
              borderRadius: '8px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
              position: 'relative' // Added for absolute positioning of delete button
            }}
            contentArrowStyle={{ borderRight: `7px solid ${config.background}` }}
          >
            <div className="absolute top-2 right-2 flex space-x-2">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedMemoryForUpload(memory.id);
                  setIsUploadDialogOpen(true);
                }}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.54)',
                  '&:hover': { color: '#2196F3' }
                }}
              >
                <ImageIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={() => setEditingMemory(memory)}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.54)',
                  '&:hover': { color: '#4CAF50' }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={() => handleDelete(memory.id)}
                disabled={isDeleting === memory.id}
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.54)',
                  '&:hover': { color: '#f44336' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>

            <h3 className="text-lg font-bold mb-2 text-gray-800 pr-8"> {/* Added pr-8 for delete button space */}
              {memory.category}
            </h3>
            <p className="text-gray-600">
              {memory.description}
            </p>
            {memory.location?.name && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {memory.location.name}
              </p>
            )}
            {memory.image_urls && memory.image_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {memory.image_urls.map((url, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={url}
                    alt={`Memory ${imgIndex + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
           
          </VerticalTimelineElement>
        );
      })}
    </VerticalTimeline>
      {/* Edit Dialog */}
      <EditMemoryDialog
        open={!!editingMemory}
        memory={editingMemory}
        onClose={() => setEditingMemory(null)}
        onSave={handleEditSave}
      />

      {/* Upload Dialog */}
      <Dialog 
        open={isUploadDialogOpen} 
        onClose={() => setIsUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some images here, or click to select files</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MemoryTimeline;