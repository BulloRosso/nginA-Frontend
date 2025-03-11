// src/types/user.ts
export interface User {
  id: string;
  email: string;
  phone?: string;
  created_at: Date;
  confirmed_at?: Date;
  email_confirmed_at?: Date;
  last_sign_in_at?: Date;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  role?: string;
  updated_at?: Date;
}

export interface UserListResponse {
  users: User[];
}