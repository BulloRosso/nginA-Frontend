// src/components/auth/ResendConfirmation.tsx
import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../../services/auth';

interface ResendConfirmationProps {
    open: boolean;
    email: string;
    onClose: () => void;
}

const ResendConfirmation: React.FC<ResendConfirmationProps> = ({
    open,
    email,
    onClose
}) => {
    const { t } = useTranslation(['common']);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResend = async () => {
        setLoading(true);
        setError(null);
        try {
            await AuthService.resendConfirmationEmail(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('common.auth.resend_confirmation_title')}</DialogTitle>
            <DialogContent>
                <Typography gutterBottom>
                    {t('common.auth.resend_confirmation_message', { email })}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {t('common.auth.resend_confirmation_success')}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleResend}
                    variant="contained"
                    disabled={loading || success}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {t('common.auth.resend_confirmation')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResendConfirmation;