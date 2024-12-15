// src/components/memories/VerticalTimeline.tsx
import React, { useCallback, useMemo, useEffect, useState } from 'react';
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
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  Grid,
  Box,
  Collapse
} from '@mui/material';
import MemoryService from '../../services/memories';
import { useDropzone } from 'react-dropzone';
import EditMemoryDialog from './EditMemoryDialog';
import ImageLightbox from './ImageLightbox';
import MemoryTypeFilter from './MemoryTypeFilter';
import { Category } from '../../types/memory';
import { useTranslation } from 'react-i18next';

interface TimelineProps {
  memories: Memory[];
  onMemoryDeleted?: () => void; // Callback to refresh the memories list
}

const categoryConfig = {
  childhood: {
    icon: SchoolIcon,
    color: '#fc9c2b',
    background: '#ffebd3'
  },
  career: {
    icon: WorkIcon,
    color: '#1eb3b7',
    background: '#c6edee'
  },
  travel: {
    icon: TravelIcon,
    color: '#879b15',
    background: '#e0e7b5'
  },
  relationships: {
    icon: RelationshipsIcon,
    color: '#ee391c',
    background: '#f9e1de'
  },
  hobbies: {
    icon: HobbiesIcon,
    color: '#9C27B0',
    background: '#F3E5F5'
  },
  pets: {
    icon: PetsIcon,
    color: '#cccccc',
    background: '#EFEBE9'
  }
};
const MemoryDescription: React.FC<{ description: string }> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <Collapse in={isExpanded} collapsedSize={54}>
        <p 
          className="text-gray-600" 
          style={{ 
            fontFamily: 'Pangolin',
            marginTop: 0,
            marginBottom: isExpanded ? 24 : 0 // Add space for button when expanded
          }}
        >
          {description}
        </p>
      </Collapse>

      <IconButton
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          position: 'absolute',
          right: '-14px',
          bottom: 0,
          padding: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          },
        }}
      >
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </div>
  );
};

const MemoryTimeline: React.FC<TimelineProps> = ({ memories, onMemoryDeleted }) => {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editingMemory, setEditingMemory] = React.useState<Memory | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedMemoryForUpload, setSelectedMemoryForUpload] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedImage, setSelectedImage] = useState<number>(-1);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<Category>>(new Set());
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const { t, i18n } = useTranslation();
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
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

  // Updated filtering logic to include both category and year range filters
  const filteredMemories = useMemo(() => {
    if (activeFilters.size === 0 && !yearRange) return memories;

    return memories.filter(memory => {
      // Category filter
      const passesCategory = activeFilters.size === 0 || activeFilters.has(memory.category);

      // Year range filter
      let passesYearRange = true;
      if (yearRange) {
        const memoryYear = new Date(memory.time_period).getFullYear();
        passesYearRange = memoryYear >= yearRange[0] && memoryYear <= yearRange[1];
      }

      return passesCategory && passesYearRange;
    });
  }, [memories, activeFilters, yearRange]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop
  });

  const handleToggleFilter = (category: Category) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(category)) {
        newFilters.delete(category);
      } else {
        newFilters.add(category);
      }
      return newFilters;
    });
  };
  
  // Calculate memory counts by category
  const memoryCounts = useMemo(() => {
    const counts = Object.values(Category).reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    memories.forEach(memory => {
      counts[memory.category]++;
    });

    return counts;
  }, [memories]);
  
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

  const handleImageClick = (memory: Memory, index: number) => {
    setSelectedMemory(memory);
    setSelectedImage(index);
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedMemory) return;

    try {
      // Get filename from URL
      const filename = imageUrl.split('/').pop()?.split('?')[0];
      if (!filename) throw new Error('Invalid image URL');

      // Delete from storage
      await MemoryService.deleteImage(selectedMemory.id, filename);

      // Update memory's image URLs
      const updatedUrls = selectedMemory.image_urls.filter(url => url !== imageUrl);
      await MemoryService.updateMemory(selectedMemory.id, {
        image_urls: updatedUrls
      });

      // Close lightbox
      setSelectedMemory(null);
      setSelectedImage(-1);

      // Refresh memories list
      if (onMemoryDeleted) {
        onMemoryDeleted();
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      setError('Failed to delete image');
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
        <Grid container spacing={1} sx={{ height: '100%' }}> {/* Changed from 700px to 100% */}
          <Grid 
            item 
            xs={12} 
            md={10} 
            lg={11}
            sx={{ 
              height: '100%',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#666',
                },
              },
            }}
          >
          <Box sx={{ height: '100%', pr: 2 }}>
              <VerticalTimeline lineColor="#DDD">
                {filteredMemories.map((memory, index) => {
                  const category = memory.category.toLowerCase();
                  const config = categoryConfig[category] || categoryConfig.childhood;
                  const IconComponent = config.icon;
                  const isEven = index % 2 === 0;
                  const hasImages = memory.image_urls && memory.image_urls.length > 0;
          
                  return (
                    
                    <VerticalTimelineElement
                      key={memory.id}
                      className={isEven ? 'vertical-timeline-element--right' : 'vertical-timeline-element--left'}
                      position={isEven ? 'right' : 'left'}
                      date={formatDate(memory.time_period)}
                      iconStyle={{ background: config.color, color: '#fff' }}
                      icon={<IconComponent />}
                      contentStyle={{
                        background: config.background,
                        borderRadius: '8px',
                        paddingTop: (hasImages) ? '40px' : '8px',
                        boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                        position: 'relative' // Added for absolute positioning of delete button
                      }}
                      contentArrowStyle={{ borderRight: `7px solid ${config.background}` }}
                    >
                      {memory.image_urls && memory.image_urls.length > 0 && (
                        <div style={{ position: 'absolute', top: '-45px' }} 
                          className="mt-3 grid grid-cols-3 gap-2">
                          {memory.image_urls.map((url, imgIndex) => (
                            <div 
                              key={imgIndex}
                              className="relative group cursor-pointer"
                              onClick={() => handleImageClick(memory, imgIndex)}
                            >
                              <img
                                src={url}
                                alt={`Memory ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded-lg transition-transform hover:scale-105"
                                style={{borderRadius: '50%',
                                        aspectRatio: '1/1', 
                                          width: '80px', 
                                          height: '100%', 
                                          objectFit: 'cover'
                                       }}
                                />
                            </div>
                          ))}
                        </div>
                      )}
                      <MemoryDescription description={memory.description} />
                      {memory.location?.name && (
                        <p className="text-sm text-gray-500 mt-2">
                          <LocationIcon /> {memory.location.name}
                        </p>
                      )}
                      
          
                      <div className="absolute bottom-2 right-2 flex space-x-2">
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
                    </VerticalTimelineElement>
                  );
                })}
              </VerticalTimeline>
          </Box>
  </Grid>

  <Grid item xs={12} md={2} lg={1}>
   
      <MemoryTypeFilter
        memoryCounts={memoryCounts}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        memories={memories}
        onYearRangeChange={setYearRange}
      />
  
  </Grid>
    {/* Lightbox */}
    {selectedMemory && selectedImage >= 0 && (
      <ImageLightbox
        open={true}
        onClose={() => {
          setSelectedMemory(null);
          setSelectedImage(-1);
        }}
        images={selectedMemory.image_urls}
        currentIndex={selectedImage}
        onNavigate={setSelectedImage}
        onDelete={handleDeleteImage}
      />
    )}
    
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
    
  </Grid>
  );
};

export default MemoryTimeline;