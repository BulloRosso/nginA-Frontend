// src/services/accounting.ts
import api from './api';
import { UUID } from '../types/common';
import { 
  BalanceResponse, 
  CreditReport, 
  IntervalType, 
  ChargeRequest, 
  RefillRequest, 
  Transaction 
} from '../types/accounting';

// Mock data for development
const getMockReport = (interval: IntervalType): CreditReport => {
  const now = new Date();
  const userId = '00000000-0000-0000-0000-000000000000';

  // Create different date ranges based on interval
  let startDate = new Date();
  if (interval === 'day') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (interval === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  return {
    user_id: userId,
    interval: interval,
    start_date: startDate.toISOString(),
    end_date: now.toISOString(),
    total_credits: 250,
    agents: [
      {
        agent_id: '11111111-1111-1111-1111-111111111111',
        total_credits: 100,
        run_count: 10,
        avg_credits_per_run: 10
      },
      {
        agent_id: '22222222-2222-2222-2222-222222222222',
        total_credits: 75,
        run_count: 5,
        avg_credits_per_run: 15
      },
      {
        agent_id: '33333333-3333-3333-3333-333333333333',
        total_credits: 75,
        run_count: 3,
        avg_credits_per_run: 25
      }
    ]
  };
};

// Mock balance data
const getMockBalance = (userId: string): BalanceResponse => {
  return {
    user_id: userId,
    balance: 750,
    timestamp: new Date().toISOString()
  };
};

export const AccountingService = {
  getBalance: async (userId: UUID): Promise<BalanceResponse> => {
    try {
      console.log(`Fetching balance for user: ${userId}`);
      const response = await api.get(`/api/v1/accounting/balance/${userId}`, {
        headers: { 'x-ngina-key': process.env.REACT_APP_NGINA_ACCOUNTING_KEY }
      });
      console.log('Balance API response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      // If there's no network connection or server is down, provide mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock balance data for development');
        return getMockBalance(userId);
      }
      throw error;
    }
  },

  chargeUser: async (userId: UUID, chargeData: ChargeRequest): Promise<Transaction> => {
    const response = await api.post(`/api/v1/accounting/charge/${userId}`, chargeData, {
      headers: { 'x-ngina-key': process.env.REACT_APP_NGINA_ACCOUNTING_KEY }
    });
    return response.data;
  },

  refillUser: async (userId: UUID, refillData: RefillRequest): Promise<Transaction> => {
    const response = await api.post(`/api/v1/accounting/refill/${userId}`, refillData, {
      headers: { 'x-ngina-key': process.env.REACT_APP_NGINA_ACCOUNTING_KEY }
    });
    return response.data;
  },

  getReport: async (interval: IntervalType): Promise<CreditReport> => {
    try {
      console.log(`Fetching report for interval: ${interval}`);

      // The backend expects /report/{interval}/{user_id}, but the user_id is extracted from JWT token
      // So we don't need to explicitly include it in the URL
      const response = await api.get(`/api/v1/accounting/report/${interval}`);
      console.log('Report API response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);

      // Fallback to mock data only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('API error - using mock data for development');
        return getMockReport(interval);
      }
      throw error;
    }
  }
};