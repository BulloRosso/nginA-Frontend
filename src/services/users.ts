// src/services/users.ts
import { User } from '../types/user';
import api from './api';

export class UserService {
  /**
   * Fetches the list of users from the API
   * @param page Page number (starting from 1)
   * @param perPage Number of items per page
   * @returns List of users
   */
  static async getUsers(page: number = 1, perPage: number = 100): Promise<User[]> {
    try {
      const response = await api.get('/api/v1/users/', {
        params: {
          page,
          per_page: perPage
        }
      });

      // Parse dates from strings to Date objects
      return response.data.map((user: any) => ({
        ...user,
        created_at: new Date(user.created_at),
        confirmed_at: user.confirmed_at ? new Date(user.confirmed_at) : undefined,
        email_confirmed_at: user.email_confirmed_at ? new Date(user.email_confirmed_at) : undefined,
        last_sign_in_at: user.last_sign_in_at ? new Date(user.last_sign_in_at) : undefined,
        updated_at: user.updated_at ? new Date(user.updated_at) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Fetches user details by ID
   * @param userId User ID to fetch
   * @returns User object or null if not found
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      // Since we don't have a dedicated endpoint for single user, 
      // we'll get all users and filter
      const allUsers = await UserService.getUsers();
      const user = allUsers.find(user => user.id === userId);

      return user || null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  /**
   * Gets multiple users by their IDs
   * @param userIds Array of user IDs to fetch
   * @returns Map of user IDs to user objects
   */
  static async getUsersByIds(userIds: string[]): Promise<Map<string, User>> {
    if (!userIds.length) {
      return new Map();
    }

    try {
      // Fetch all users from our single API endpoint
      const allUsers = await UserService.getUsers();

      const userMap = new Map<string, User>();
      const filteredUsers = allUsers.filter(user => userIds.includes(user.id));

      filteredUsers.forEach(user => {
        userMap.set(user.id, user);
      });

      return userMap;
    } catch (error) {
      console.error('Error fetching users by IDs:', error);
      throw error;
    }
  }
}

export default UserService;