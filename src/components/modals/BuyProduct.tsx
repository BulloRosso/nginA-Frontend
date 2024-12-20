// src/components/modals/BuyProduct.tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  LocalOffer as PriceIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import '../../pages/styles/GoldButton.css';

interface BuyProductProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

const BuyProduct: React.FC<BuyProductProps> = ({ open, onClose, profileId, profileName }) => {
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const benefits = useMemo(() => [
    {
      category: t('buy.category.memories'),
      basic: t('buy.basic_memories'),
      premium: t('buy.premium_memories'),
      
    },
    {
      category: t('buy.category.storage'),
      basic: t('buy.basic_storage'),
      premium: t('buy.premium_storage'),
     
    },
    {
      category: t('buy.category.export'),
      basic: t('buy.basic_exports'),
      premium: t('buy.premium_exports'),
    
    },
    {
      category: t('buy.category.support'),
      basic: t('buy.basic_retention'),
      premium: t('buy.premium_retention'),
   
    },
  ], [t]); 

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      await ProfileService.subscribeProfile(profileId);
      onClose();
      // Optionally refresh the profiles list or show success message
    } catch (error) {
      console.error('Failed to process subscription:', error);
      // Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4" sx={{ color: '#34495e', mb:0, fontFamily: 'Averia Libre' }} align="center" gutterBottom>
          {t('buy.title', { name: profileName })}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ backgroundImage: 'url(/public/noblivion-opener.jpg)',
                           backgroundSize: 'cover' }}>
        {/* Price Tag */}
        <Box
          sx={{
            textAlign: 'center',
            my: 4,
            p: 3,
            bgcolor: 'gold',
            borderRadius: 2,
            display: 'inline-block',
            position: 'relative',
           
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          className="gold-button"
        >
          <PriceIcon sx={{ fontSize: 40, color: 'black', mb: 1 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'black', }}>
            {t('profile.currency')}299
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#000' }}>
            {t('buy.one_time_payment')}
          </Typography>
        </Box>

        {/* Benefits Table */}
        <TableContainer component={Paper} sx={{ mb: 4, opacity: 0.8 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>{t('buy.feature')}</TableCell>
                <TableCell>{t('buy.basic')}</TableCell>
                <TableCell sx={{ bgcolor: 'gold', color: '#000' }}>
                  {t('buy.premium')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {benefits.map((row, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    <b>{row.category}</b>
                  </TableCell>
                  <TableCell>{row.basic}</TableCell>
                  <TableCell sx={{ bgcolor: '#fff9c4' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: 'gold' }} />
                      {row.premium}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Checkout Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            sx={{ color: "black", 
                 backgroundColor: 'gold', 
                 fontWeight: 'bold', 
                 '&:hover': {
                   backgroundColor: '#e2bf02',
                   color: 'white'
                 },
                 borderRadius: '10px', mb: 2 }}
            onClick={handleCheckout}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('buy.checkout')
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BuyProduct;