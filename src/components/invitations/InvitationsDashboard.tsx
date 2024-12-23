// src/components/invitations/InvitationsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Button,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TimerOff as ExpiredIcon,
  CheckCircle as ActiveIcon,
  Block as RevokedIcon,
  Extension as ExtendIcon,
  Cancel as RevokeIcon
} from '@mui/icons-material';
import { format, formatDistance } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { InvitationService } from '../../services/invitations';
import { Invitation, InvitationStatus } from '../../types/invitation';
import ExtendInvitationDialog from './ExtendInvitationDialog';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';

const statusIcons = {
  [InvitationStatus.ACTIVE]: <ActiveIcon color="success" />,
  [InvitationStatus.EXPIRED]: <ExpiredIcon color="error" />,
  [InvitationStatus.REVOKED]: <RevokedIcon color="warning" />
};

const InvitationsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invitationsData, statsData] = await Promise.all([
        InvitationService.getDashboard(includeExpired),
        InvitationService.getStats()
      ]);
      setInvitations(invitationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [includeExpired]);

  const handleExtend = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setExtendDialogOpen(true);
  };

  const handleRevoke = async (invitationId: string) => {
    if (window.confirm(t('invitation.confirm_revoke'))) {
      try {
        await InvitationService.revokeInvitation(invitationId);
        fetchData();
      } catch (error) {
        console.error('Error revoking invitation:', error);
      }
    }
  };

  if (loading && !invitations.length) {
    return <LoadingState message={t('invitation.loading_dashboard')} />;
  }

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
       {loading && <LoadingState overlay message={t('invitation.refreshing')} />}
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {stats && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{t('invitation.stats.total')}</Typography>
                      <Typography variant="h4">{stats.total_invitations}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{t('invitation.stats.active')}</Typography>
                      <Typography variant="h4" color="success.main">
                        {stats.active_invitations}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {error && (
                  <Grid item xs={12}>
                    <ErrorState
                      error={error}
                      onRetry={fetchData}
                      title={t('invitation.load_error')}
                    />
                  </Grid>
                )}
                {/* Add more stat cards */}
              </>
            )}
          </Grid>
        </Grid>

        {/* Invitations Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{t('invitation.list_title')}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Switch
                    checked={includeExpired}
                    onChange={(e) => setIncludeExpired(e.target.checked)}
                  />
                  <Typography variant="body2">
                    {t('invitation.show_expired')}
                  </Typography>
                </Box>
                <IconButton onClick={fetchData} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('invitation.table.profile')}</TableCell>
                    <TableCell>{t('invitation.table.email')}</TableCell>
                    <TableCell>{t('invitation.table.status')}</TableCell>
                    <TableCell>{t('invitation.table.expires')}</TableCell>
                    <TableCell>{t('invitation.table.sessions')}</TableCell>
                    <TableCell>{t('invitation.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        {`${invitation.profile_first_name} ${invitation.profile_last_name}`}
                      </TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {statusIcons[invitation.status]}
                          <Chip
                            label={t(`invitation.status.${invitation.status}`)}
                            color={invitation.status === InvitationStatus.ACTIVE ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.expires_at), 'PPP')}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {formatDistance(new Date(invitation.expires_at), new Date(), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      <TableCell>{invitation.session_count}</TableCell>
                      <TableCell>
                        {invitation.status === InvitationStatus.ACTIVE && (
                          <>
                            <Tooltip title={t('invitation.extend')}>
                              <IconButton onClick={() => handleExtend(invitation)}>
                                <ExtendIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('invitation.revoke')}>
                              <IconButton 
                                onClick={() => handleRevoke(invitation.id)}
                                color="error"
                              >
                                <RevokeIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <ExtendInvitationDialog
        open={extendDialogOpen}
        onClose={() => {
          setExtendDialogOpen(false);
          setSelectedInvitation(null);
        }}
        invitation={selectedInvitation}
        onSuccess={fetchData}
      />
    </Box>
  );
};

export default InvitationsDashboard;