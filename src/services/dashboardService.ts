// src/services/dashboardService.ts
import { DashboardComponent } from '../types/dashboard';
import dashboardApi from './dashboardApi';

// Mock data for development and testing
const mockDashboardComponents: DashboardComponent[] = [
  {
    id: '7c1a99eb-73ab-4908-b928-f1d932f52776',
    created_at: new Date().toISOString(),
    name: 'Credit Status',
    type: 'info',
    layout_cols: 3,
    layout_rows: 2,
    react_component_name: 'credit_tile'
  },
  {
    id: '2e9a8f71-4c6c-43f2-b3a5-5e89b5b7e46d',
    created_at: new Date().toISOString(),
    name: 'Monthly Transactions',
    type: 'chart',
    layout_cols: 6,
    layout_rows: 4,
    react_component_name: 'transaction_chart'
  },
  {
    id: '5a9c7d2e-3b4f-4a8e-9d2c-1e5f3g6h7i8j',
    created_at: new Date().toISOString(),
    name: 'Recent Alerts',
    type: 'list',
    layout_cols: 3,
    layout_rows: 4,
    react_component_name: 'alerts_list'
  },
  {
    id: '8f7e6d5c-4b3a-2n1m-0p9o-8i7u6y5t4r3e',
    created_at: new Date().toISOString(),
    name: 'Quick Actions',
    type: 'buttons',
    layout_cols: 3,
    layout_rows: 2,
    react_component_name: 'quick_actions'
  }
];

class DashboardService {
  /**
   * Get all available dashboard components
   * @param mockData Use mock data instead of API call
   * @returns Promise with dashboard components
   */
  static async getDashboardComponents(mockData: boolean = false): Promise<DashboardComponent[]> {
    if (mockData) {
      return mockDashboardComponents;
    }

    try {
      console.log("Fetching dashboard components from API");
      const response = await dashboardApi.get('/api/v1/dashboard/components');
      console.log("Dashboard components API response:", response);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching dashboard components:", error);

      // If there's a 500 error, we can provide some fallback data for development
      if (error.response && error.response.status === 500) {
        console.warn("Returning hardcoded data since backend is failing");
        return mockDashboardComponents;
      }

      throw error;
    }
  }

  /**
   * Get a specific dashboard by ID
   * @param dashboardId Dashboard ID to fetch
   * @param mockData Use mock data instead of API call
   * @returns Promise with dashboard data
   */
  static async getDashboard(dashboardId: string, mockData: boolean = false) {
    if (mockData) {
      return {
        id: dashboardId,
        created_at: new Date().toISOString(),
        description: {
          en: {
            title: 'Development Dashboard',
            description: 'This is a mock dashboard for development purposes.'
          }
        },
        configuration: {
          components: mockDashboardComponents.map((component, index) => ({
            ...component,
            startCol: ((index * 3) % 12) + 1,
            startRow: Math.floor((index * 3) / 12) * 2 + 1
          }))
        }
      };
    }

    try {
      const response = await dashboardApi.get(`/api/v1/dashboards/${dashboardId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      throw error;
    }
  }
}

export default DashboardService;