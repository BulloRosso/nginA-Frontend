import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  ImageList,
  ImageListItem,
  Chip,
  Divider,
  Button,
  Fab,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { styled } from '@mui/material/styles';
import {
  Timeline as TimelineIcon,
  Close as CloseIcon,
  EventNote as EventIcon,
  Work as WorkIcon,
  Flight as TravelIcon,
  People as RelationshipsIcon,
  SportsEsports as HobbiesIcon,
  Pets as PetsIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

// Category-specific colors and icons
const categoryConfig = {
  childhood: {
    color: '#FF9800',
    icon: EventIcon,
    label: 'Childhood'
  },
  career: {
    color: '#2196F3',
    icon: WorkIcon,
    label: 'Career'
  },
  travel: {
    color: '#4CAF50',
    icon: TravelIcon,
    label: 'Travel'
  },
  relationships: {
    color: '#E91E63',
    icon: RelationshipsIcon,
    label: 'Relationships'
  },
  hobbies: {
    color: '#9C27B0',
    icon: HobbiesIcon,
    label: 'Hobbies'
  },
  pets: {
    color: '#795548',
    icon: PetsIcon,
    label: 'Pets'
  }
};

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const TimelineDrawerContent = styled(Box)(({ theme }) => ({
  width: '400px',
  [theme.breakpoints.up('sm')]: {
    width: '500px',
  },
}));

const MemoryCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const StyledTimelineDot = styled(TimelineDot)(({ color }) => ({
  backgroundColor: color,
}));

const MemoryTimeline = ({ memories, onMemorySelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearFilters, setYearFilters] = useState([]);

  useEffect(() => {
    // Extract unique years from memories
    const years = [...new Set(memories.map(memory => 
      new Date(memory.time_period).getFullYear()
    ))].sort((a, b) => b - a);
    setYearFilters(years);
  }, [memories]);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const handleMemoryClick = (memory) => {
    if (onMemorySelect) {
      onMemorySelect(memory);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredMemories = selectedYear
    ? memories.filter(memory => 
        new Date(memory.time_period).getFullYear() === selectedYear)
    : memories;

  return (
    <>
      <Fab
        color="primary"
        aria-label="timeline"
        onClick={toggleDrawer}
        sx={{ position: 'fixed', bottom: 16, left: 16 }}
      >
        <TimelineIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={toggleDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500 },
            maxWidth: '100%'
          }
        }}
      >
        <TimelineDrawerContent>
          <DrawerHeader>
            <Typography variant="h6">Memory Timeline</Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </DrawerHeader>

          <Divider />

          {/* Year filters */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={selectedYear === null ? 'contained' : 'outlined'}
              onClick={() => setSelectedYear(null)}
            >
              All
            </Button>
            {yearFilters.map(year => (
              <Button
                key={year}
                size="small"
                variant={selectedYear === year ? 'contained' : 'outlined'}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </Box>

          <Timeline position="right" sx={{ px: 2 }}>
            {filteredMemories.map((memory, index) => {
              const CategoryIcon = categoryConfig[memory.category].icon;
              return (
                <TimelineItem key={memory.id}>
                  <TimelineOppositeContent sx={{ flex: 0.2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(memory.time_period)}
                    </Typography>
                  </TimelineOppositeContent>

                  <TimelineSeparator>
                    <StyledTimelineDot color={categoryConfig[memory.category].color}>
                      <CategoryIcon />
                    </StyledTimelineDot>
                    {index < memories.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>

                  <TimelineContent>
                    <MemoryCard onClick={() => handleMemoryClick(memory)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={categoryConfig[memory.category].label}
                          size="small"
                          sx={{
                            backgroundColor: categoryConfig[memory.category].color,
                            color: 'white',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {memory.description.length > 150 
                          ? `${memory.description.substring(0, 150)}...` 
                          : memory.description}
                      </Typography>

                      {memory.image_urls && memory.image_urls.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <ImageList cols={3} rowHeight={80} sx={{ m: 0 }}>
                            {memory.image_urls.slice(0, 3).map((url, imgIndex) => (
                              <ImageListItem key={imgIndex}>
                                <img
                                  src={url}
                                  alt={`Memory ${imgIndex + 1}`}
                                  loading="lazy"
                                  style={{ 
                                    objectFit: 'cover',
                                    height: '100%',
                                    width: '100%',
                                    borderRadius: '4px'
                                  }}
                                />
                              </ImageListItem>
                            ))}
                            {memory.image_urls.length > 3 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  right: 4,
                                  bottom: 4,
                                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                                  color: 'white',
                                  borderRadius: '12px',
                                  padding: '2px 6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <ImageIcon fontSize="small" />
                                <Typography variant="caption">
                                  +{memory.image_urls.length - 3}
                                </Typography>
                              </Box>
                            )}
                          </ImageList>
                        </Box>
                      )}

                      {memory.emotions && memory.emotions.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {memory.emotions.map((emotion, index) => (
                            <Chip
                              key={index}
                              label={emotion}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </MemoryCard>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </TimelineDrawerContent>
      </Drawer>
    </>
  );
};
export default MemoryTimeline
