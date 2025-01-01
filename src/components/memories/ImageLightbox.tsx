import React from 'react';
import { Dialog, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { 
  Close as CloseIcon, 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onDelete: (url: string) => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  open,
  onClose,
  images,
  currentIndex,
  onNavigate,
  onDelete
}) => {
  const { t } = useTranslation('memory');

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { 
          m: 1  
        }
      }}
    >
      <div className="relative bg-black min-h-[80vh] flex items-center justify-center">
        {/* Close button */}
        <IconButton
          onClick={onClose}
          aria-label={t('memory.lightbox.close')}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            '&:hover': {
              color: '#e0e0e0'
            },
            zIndex: 10
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Delete button */}
        <IconButton
          onClick={() => onDelete(images[currentIndex])}
          aria-label={t('memory.lightbox.delete')}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            color: 'white',
            '&:hover': {
              color: '#f44336'
            },
            zIndex: 10
          }}
        >
          <DeleteIcon />
        </IconButton>

        {/* Navigation */}
        {currentIndex > 0 && (
          <IconButton
            onClick={() => onNavigate(currentIndex - 1)}
            aria-label={t('memory.lightbox.previous')}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              '&:hover': {
                color: '#e0e0e0'
              },
              zIndex: 10
            }}
          >
            <ChevronLeftIcon fontSize="large" />
          </IconButton>
        )}

        {currentIndex < images.length - 1 && (
          <IconButton
            onClick={() => onNavigate(currentIndex + 1)}
            aria-label={t('memory.lightbox.next')}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              '&:hover': {
                color: '#e0e0e0'
              },
              zIndex: 10
            }}
          >
            <ChevronRightIcon fontSize="large" />
          </IconButton>
        )}

        {/* Main Image */}
        <img
          src={images[currentIndex]}
          alt={t('memory.lightbox.image_alt', { number: currentIndex + 1 })}
          className="max-h-[calc(80vh-100px)] max-w-full object-contain"
        />

        {/* Thumbnails */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 overflow-hidden">
          <div className="flex justify-center space-x-2 overflow-x-auto overflow-y-hidden">
            {images.map((image, index) => (
              <div
                key={index}
                onClick={() => onNavigate(index)}
                className={`
                  cursor-pointer transition-all duration-200
                  ${index === currentIndex ? 'ring-2 ring-[gold] scale-105' : 'opacity-50 hover:opacity-100'}
                `}
              >
                <img
                  src={image}
                  alt={t('lightbox.thumbnail_alt', { number: index + 1 })}
                  className="h-16 w-16 object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Image counter */}
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full"
        >
          {t('memory.lightbox.image_counter', { current: currentIndex + 1, total: images.length })}
        </div>
      </div>
    </Dialog>
  );
};

export default ImageLightbox;