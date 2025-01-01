// src/types/invitation.ts
import { UUID } from './common';

export enum InvitationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export interface Invitation {
  id: UUID;
  profile_id: UUID;
  created_by: UUID;
  email: string;
  secret_token: string;
  expires_at: string;
  last_used_at?: string;
  status: InvitationStatus;
  session_count: number;
  created_at: string;
  updated_at: string;
  profile_first_name: string;
  profile_last_name: string;
}

export interface InvitationStats {
  total_invitations: number;
  active_invitations: number;
  expired_invitations: number;
  total_sessions: number;
  average_sessions_per_invitation: number;
}

export interface CreateInvitationDto {
  profile_id: UUID;
  email: string;
  language: string;
}