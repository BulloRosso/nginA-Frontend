// src/components/memories/ImageLightbox.tsx
import React from 'react';
import {
  Dialog,
  IconButton,
  DialogContent,
  Box,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext,
  NavigateBefore,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onDelete?: (imageUrl: string) => Promise<void>;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  open,
  onClose,
  images,
  currentIndex,
  onNavigate,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(images[currentIndex]);
      if (images.length > 1) {
        onNavigate(Math.min(currentIndex, images.length - 2));
      } else {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          position: 'relative'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.4)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Delete button */}
        {onDelete && (
          <IconButton
            onClick={handleDelete}
            disabled={isDeleting}
            sx={{
              position: 'absolute',
              top: 8,
              right: 56,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.4)',
              '&:hover': { bgcolor: 'rgba(255,0,0,0.6)' }
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.4)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
              }}
            >
              <NavigateBefore />
            </IconButton>
            <IconButton
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={currentIndex === images.length - 1}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.4)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
              }}
            >
              <NavigateNext />
            </IconButton>
          </>
        )}

        {/* Image */}
        <Box
          component="img"
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          sx={{
            maxHeight: 'calc(100vh - 64px)',
            maxWidth: '100%',
            objectFit: 'contain'
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;