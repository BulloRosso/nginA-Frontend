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
import './VerticalTimeline.css';
import UploadDialog from './UploadDialog';

interface TimelineProps {
  memories: Memory[];
  onMemoryDeleted?: () => void; 
  onMemorySelect?: (memory: Memory) => void;
  selectedMemoryId?: string | null;
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

const MemoryCaption: React.FC<{description: string}> = ({description}) => {

   return (
     <div style={{ marginTop: '8px',}}>{description}</div>
   )
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

const MemoryTimeline: React.FC<TimelineProps> = ({ memories,
                                                  onMemoryDeleted, 
                                                  onMemorySelect,
                                                  selectedMemoryId = null  }) => {
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
  const { t, i18n } = useTranslation(['memory', 'common']);
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: 'numeric'
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
    if (activeFilters.size === 0 && !yearRange) 
      return [...memories].sort((a, b) => new Date(b.timePeriod).getTime() - new Date(a.timePeriod).getTime());


      return memories
      .filter(memory => {
          // Category filter
          const passesCategory = activeFilters.size === 0 || activeFilters.has(memory.category);

          // Year range filter
          let passesYearRange = true;
          if (yearRange) {
              const memoryYear = new Date(memory.timePeriod).getFullYear();
              passesYearRange = memoryYear >= yearRange[0] && memoryYear <= yearRange[1];
          }

          return passesCategory && passesYearRange;
      })
      .sort((a, b) => new Date(b.timePeriod).getTime() - new Date(a.timePeriod).getTime());
    
  }, [memories, activeFilters, yearRange]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    onDrop
  });

  const handleUpload = async (files: File[]) => {
    if (!selectedMemoryForUpload) return;

    try {
      const urls = await MemoryService.addMediaToMemory(selectedMemoryForUpload, files);

      if (onMemoryDeleted) {
        onMemoryDeleted();
      }

      setIsUploadDialogOpen(false);
    } catch (err) {
      throw new Error('Failed to upload images');
    }
  };

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
      console.log('Saving updated memory:', updatedMemory);
      const result = await MemoryService.updateMemory(updatedMemory.id!, updatedMemory);
      console.log('Update result:', result);

      if (onMemoryDeleted) {
        onMemoryDeleted(); // Refresh the memories list
      }
      setEditingMemory(null);
    } catch (err) {
      console.error('Failed to update memory:', err);
      setError('Failed to update memory');
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

      console.log('Starting image deletion process:', {
          memoryId: selectedMemory.id,
          filename,
          imageUrl,
          currentUrls: selectedMemory.imageUrls
      });
      
      // Delete from storage
      await MemoryService.deleteImage(selectedMemory.id, filename);
       console.log('Successfully deleted image from storage');

      const updatedUrls = selectedMemory.imageUrls.filter(url => url !== imageUrl);
      console.log('Updating memory with new URLs:', updatedUrls);
      
      // Update memory's image URLs
      await MemoryService.updateMemory(selectedMemory.id, {
        imageUrls: updatedUrls
      });
      console.log('Successfully updated memory');

      // Close lightbox
      setSelectedMemory(null);
      setSelectedImage(-1);

      // Refresh memories list
      if (onMemoryDeleted) {
        console.log('Triggering memory list refresh');
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
        <Grid container spacing={0} sx={{ height: '100%' }}> {/* Changed from 700px to 100% */}
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
          <Box sx={{ height: '100%' }}>
            <div className="vertical-timeline-wrapper">
              <VerticalTimeline lineColor="#DDD">
                {filteredMemories.map((memory, index) => {
                  const category = (memory?.category || Category.CHILDHOOD).toLowerCase();
                  const config = categoryConfig[category] || categoryConfig.childhood;
                  const IconComponent = config.icon;
                  const isEven = index % 2 === 0;
                  const hasImages = memory.imageUrls && memory.imageUrls.length > 0;

                  return (
                    
                      <VerticalTimelineElement
                        key={memory.id}
                        className={isEven ? 'vertical-timeline-element--right' : 'vertical-timeline-element--left'}
                        position={isEven ? 'right' : 'left'}
                        date={formatDate(memory.timePeriod)}
                        iconStyle={{ 
                          background: selectedMemoryId === memory.id ? '#fff' : config.color,
                          color: selectedMemoryId === memory.id ? config.color : '#fff',
                          cursor: 'pointer',
                          border: selectedMemoryId === memory.id ? `2px solid ${config.color}` : 'none',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 0 8px rgba(0,0,0,0.2)'
                          }
                        }}
                        icon={
                          <IconComponent 
                            onClick={() => onMemorySelect?.(memory)} 
                            sx={{ 
                              fontSize: '1.2rem',
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.2)'
                              }
                            }}
                          />
                        }
                        contentStyle={{
                          background: selectedMemoryId === memory.id ? '#fff' : config.background,
                          borderRadius: '8px',
                          paddingTop: (hasImages) ? '40px' : '8px',
                          boxShadow: selectedMemoryId === memory.id 
                            ? '0 0 0 2px #1eb3b7'
                            : '0 3px 6px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}
                        contentArrowStyle={{ 
                          borderRight: `7px solid ${selectedMemoryId === memory.id ? '#1eb3b7' : config.background}` 
                        }}
                      >
                      {memory.imageUrls && memory.imageUrls.length > 0 && (
                        <div style={{ position: 'absolute', top: '-38px' }} 
                          className="mt-3 grid grid-cols-3 gap-2">
                          {memory.imageUrls.map((url, imgIndex) => (
                            <div 
                              key={imgIndex}
                              className="relative group cursor-pointer"
                              onClick={() => handleImageClick(memory, imgIndex)}
                            >
                              <img
                                src={url}
                                alt={`Memory ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded-lg transition-transform hover:scale-105"
                                style={{borderRadius: '6px',
                                        aspectRatio: '1/1', 
                                          width: '70px', 
                                          height: '100%', 
                                          objectFit: 'cover'
                                       }}
                                />
                            </div>
                          ))}
                        </div>
                      )}
                      <MemoryCaption description={memory.caption} />
                      <MemoryDescription description={memory.description} />
                      {memory.location?.name && (
                        <p className="text-sm text-gray-500 mt-2" style={{ position: 'relative', top: '-10px' }}>
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
              </VerticalTimeline></div>
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
        images={selectedMemory.imageUrls}
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
    <UploadDialog 
      open={isUploadDialogOpen}
      onClose={() => setIsUploadDialogOpen(false)}
      onUpload={handleUpload}
      maxFiles={5} // or whatever limit you want to set
    />

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