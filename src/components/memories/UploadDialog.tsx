import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { 
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  ErrorOutline as ErrorIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
}

const UploadDialog: React.FC<UploadDialogProps> = ({
  open,
  onClose,
  onUpload,
  maxFiles = 10
}) => {
  const { t } = useTranslation('memory');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    setUploadError(null);

    // Generate previews for new files
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    // Revoke old preview URLs to prevent memory leaks
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews(newPreviews);
  }, [maxFiles, selectedFiles, previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': []
    },
    maxFiles,
    onDrop
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(selectedFiles);

      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        // Cleanup
        previews.forEach(url => URL.revokeObjectURL(url));
        setPreviews([]);
        setSelectedFiles([]);
        setUploadProgress(0);
        onClose();
      }, 1000);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('upload.error_generic'));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  return (
    <Dialog 
      open={open} 
      onClose={!isUploading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className="flex justify-between items-center">
        <span>{t('memory.upload.title')}</span>
        {!isUploading && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon className="text-gray-400 text-4xl mb-2" />
            <p className="text-gray-600">
              {isDragActive ? t('memory.upload.drop_here') : t('memory.upload.drag_drop')}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {t('memory.upload.supported_formats')}
              <br />
              {t('memory.upload.max_files', { count: maxFiles })}
            </p>
          </div>

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {t('memory.upload.selected_files', { count: selectedFiles.length, max: maxFiles })}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square"
                  >
                    <img
                      src={previews[index]}
                      alt={`${t('upload.preview')} ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {!isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                        <IconButton
                          size="small"
                          onClick={() => removeFile(index)}
                          className="opacity-0 group-hover:opacity-100"
                          sx={{ color: 'white' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black bg-opacity-50 rounded px-1 py-0.5 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <LinearProgress variant="determinate" value={uploadProgress} />
              <p className="text-sm text-gray-500 text-center">
                {t('memory.upload.uploading')} {uploadProgress}%
              </p>
            </div>
          )}

          {/* Error message */}
          {uploadError && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-2 rounded">
              <ErrorIcon fontSize="small" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className={`
              w-full py-2 px-4 rounded-lg text-white font-medium
              ${isUploading || selectedFiles.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'}
              transition-colors
            `}
          >
            {isUploading ? t('memory.upload.uploading') : t('memory.upload.upload_button')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;