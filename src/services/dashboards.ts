// src/services/dashboards.ts
import { Dashboard, DashboardCreateDto, DashboardComponent, DashboardComponentCreateDto } from '../types/dashboard';
import api from './api';

// Mock data for demonstration purposes
const mockDashboards: Dashboard[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    configuration: {
      refreshInterval: 60000,
      theme: 'light',
      layout: 'grid'
    },
    agents: [
      { id: '1', position: { x: 0, y: 0, w: 2, h: 2 } },
      { id: '3', position: { x: 2, y: 0, w: 2, h: 1 } }
    ],
    is_anonymous: false,
    user_id: 'user-123',
    description: {
      en: {
        title: 'Marketing Analytics',
        description: 'Dashboard for tracking marketing campaign performance'
      }
    },
    style: {
      layout: {
        logoUrl: 'https://abc.com/logo.svg',
        templateName: 'marketing'
      },
      components: [
        { id: 'header', props: { title: 'Marketing Overview', color: 'primary' } }
      ]
    }
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    configuration: {
      refreshInterval: 300000,
      theme: 'dark',
      layout: 'flex'
    },
    agents: [
      { id: '2', position: { x: 0, y: 0, w: 4, h: 2 } },
      { id: '4', position: { x: 0, y: 2, w: 4, h: 2 } }
    ],
    is_anonymous: true,
    description: {
      en: {
        title: 'Data Science Toolkit',
        description: 'Collection of data processing and visualization tools'
      }
    },
    style: {
      layout: {
        logoUrl: 'https://abc.com/data-logo.svg',
        templateName: 'datascience'
      },
      components: [
        { id: 'header', props: { title: 'Data Processing Tools', color: 'info' } }
      ]
    }
  }
];

// Mock data for dashboard components
const mockDashboardComponents: DashboardComponent[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    name: 'Chart Component',
    type: 'visualization',
    layout_cols: 2,
    layout_rows: 2,
    react_component_name: 'ChartComponent'
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    name: 'Data Table',
    type: 'data',
    layout_cols: 3,
    layout_rows: 2,
    react_component_name: 'DataTableComponent'
  },
  {
    id: '3',
    created_at: new Date().toISOString(),
    name: 'Metrics Panel',
    type: 'metrics',
    layout_cols: 1,
    layout_rows: 1,
    react_component_name: 'MetricsPanel'
  },
  {
    id: '4',
    created_at: new Date().toISOString(),
    name: 'Agent Launcher',
    type: 'control',
    layout_cols: 1,
    layout_rows: 1,
    react_component_name: 'AgentLauncher'
  }
];

export class DashboardService {
  //
  // Dashboard CRUD operations
  //
  static async getDashboards(userId?: string, mockData: boolean = false): Promise<Dashboard[]> {
    if (mockData) {
      if (userId) {
        return mockDashboards.filter(dashboard => dashboard.user_id === userId);
      }
      return mockDashboards;
    }

    let url = '/api/v1/dashboards';
    if (userId) {
      url += `?user_id=${userId}`;
    }

    const response = await api.get(url);
    return response.data;
  }

  static async getDashboard(id: string, mockData: boolean = false): Promise<Dashboard | null> {
    if (mockData) {
      return mockDashboards.find(dashboard => dashboard.id === id) || null;
    }

    try {
      const response = await api.get(`/api/v1/dashboards/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async createDashboard(dashboardData: DashboardCreateDto, mockData: boolean = false): Promise<Dashboard> {
    if (mockData) {
      const newDashboard: Dashboard = {
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        configuration: dashboardData.configuration,
        agents: dashboardData.agents,
        is_anonymous: dashboardData.is_anonymous !== undefined ? dashboardData.is_anonymous : true,
        user_id: dashboardData.user_id,
        description: dashboardData.description,
        style: dashboardData.style
      };

      return newDashboard;
    }

    const response = await api.post('/api/v1/dashboards', dashboardData);
    return response.data;
  }

  static async updateDashboard(id: string, dashboardData: Partial<DashboardCreateDto>, mockData: boolean = false): Promise<Dashboard | null> {
    if (mockData) {
      const dashboardIndex = mockDashboards.findIndex(dashboard => dashboard.id === id);
      if (dashboardIndex === -1) return null;

      const updatedDashboard = {
        ...mockDashboards[dashboardIndex],
        ...dashboardData,
        id: id, // Ensure ID doesn't change
        created_at: mockDashboards[dashboardIndex].created_at // Ensure created_at doesn't change
      };

      return updatedDashboard;
    }

    try {
      const response = await api.put(`/api/v1/dashboards/${id}`, dashboardData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async deleteDashboard(id: string, mockData: boolean = false): Promise<boolean> {
    if (mockData) {
      return true; // Always successful in mock
    }

    await api.delete(`/api/v1/dashboards/${id}`);
    return true;
  }

  //
  // Dashboard Components CRUD operations
  //
  static async getDashboardComponents(mockData: boolean = false): Promise<DashboardComponent[]> {
    if (mockData) {
      return mockDashboardComponents;
    }

    try {
      console.log("Fetching dashboard components from API");
      const response = await api.get('/api/v1/dashboards/components');
      console.log("Dashboard components API response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard components:", error);
      // If there's a 500 error, we can provide some fallback data for development
      if (error.response && error.response.status === 500) {
        console.warn("Returning hardcoded data since backend is failing");
        return [
          {
            id: '7c1a99eb-73ab-4908-b928-f1d932f52776',
            created_at: new Date().toISOString(),
            name: 'credit_tile',
            type: 'info',
            layout_cols: 2,
            layout_rows: 2,
            react_component_name: 'credit_tile'
          },
          {
            id: 'a3a74b35-2803-4cd2-9e63-4039bd41dbb7',
            created_at: new Date().toISOString(),
            name: 'chatbot',
            type: 'interactive',
            layout_cols: 4,
            layout_rows: 6,
            react_component_name: 'chatbot'
          },
          {
            id: 'e3ab0d49-48dc-4572-8d2c-4ed79f391a1c',
            created_at: new Date().toISOString(),
            name: 'scratchpad',
            type: 'content',
            layout_cols: 6,
            layout_rows: 4,
            react_component_name: 'scratchpad'
          }
        ];
      }
      throw error;
    }
  }

  static async getDashboardComponent(id: string, mockData: boolean = false): Promise<DashboardComponent | null> {
    if (mockData) {
      return mockDashboardComponents.find(component => component.id === id) || null;
    }

    try {
      const response = await api.get(`/api/v1/dashboards/components/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async createDashboardComponent(componentData: DashboardComponentCreateDto, mockData: boolean = false): Promise<DashboardComponent> {
    if (mockData) {
      const newComponent: DashboardComponent = {
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        name: componentData.name,
        type: componentData.type,
        layout_cols: componentData.layout_cols || 2,
        layout_rows: componentData.layout_rows || 2,
        react_component_name: componentData.react_component_name
      };

      return newComponent;
    }

    const response = await api.post('/api/v1/dashboards/components', componentData);
    return response.data;
  }

  static async updateDashboardComponent(id: string, componentData: Partial<DashboardComponentCreateDto>, mockData: boolean = false): Promise<DashboardComponent | null> {
    if (mockData) {
      const componentIndex = mockDashboardComponents.findIndex(component => component.id === id);
      if (componentIndex === -1) return null;

      const updatedComponent = {
        ...mockDashboardComponents[componentIndex],
        ...componentData,
        id: id, // Ensure ID doesn't change
        created_at: mockDashboardComponents[componentIndex].created_at // Ensure created_at doesn't change
      };

      return updatedComponent;
    }

    try {
      const response = await api.put(`/api/v1/dashboards/components/${id}`, componentData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async deleteDashboardComponent(id: string, mockData: boolean = false): Promise<boolean> {
    if (mockData) {
      return true; // Always successful in mock
    }

    await api.delete(`/api/v1/dashboards/components/${id}`);
    return true;
  }

  //
  // Additional Dashboard Functions
  //
  static async updateDashboardAgents(id: string, agents: any[], mockData: boolean = false): Promise<Dashboard | null> {
    if (mockData) {
      const dashboardIndex = mockDashboards.findIndex(dashboard => dashboard.id === id);
      if (dashboardIndex === -1) return null;

      const updatedDashboard = {
        ...mockDashboards[dashboardIndex],
        agents: agents,
        id: id, // Ensure ID doesn't change
        created_at: mockDashboards[dashboardIndex].created_at // Ensure created_at doesn't change
      };

      // Update mockDashboards array with updatedDashboard
      mockDashboards[dashboardIndex] = updatedDashboard;
      console.log('Mock data updated:', updatedDashboard);
      return updatedDashboard;
    }

    try {
      console.log('Sending update to API for dashboard agents:', id);

      // First get the current dashboard data
      const currentDashboard = await DashboardService.getDashboard(id, false);
      if (!currentDashboard) {
        console.error('Dashboard not found for update');
        return null;
      }

      // Create update payload with updated agents
      const updatePayload = {
        ...currentDashboard,
        agents: agents
      };

      // Use PUT as required by backend
      const response = await api.put(`/api/v1/dashboards/${id}`, updatePayload);
      return response.data;
    } catch (error) {
      console.error('Error updating dashboard agents:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async updateDashboardStyle(id: string, style: Style, mockData: boolean = false): Promise<Dashboard | null> {
    if (mockData) {
      const dashboardIndex = mockDashboards.findIndex(dashboard => dashboard.id === id);
      if (dashboardIndex === -1) return null;

      const updatedDashboard = {
        ...mockDashboards[dashboardIndex],
        style: style,
        id: id, // Ensure ID doesn't change
        created_at: mockDashboards[dashboardIndex].created_at // Ensure created_at doesn't change
      };

      // Update mockDashboards array with updatedDashboard
      mockDashboards[dashboardIndex] = updatedDashboard;
      console.log('Mock data updated:', updatedDashboard);
      return updatedDashboard;
    }

    try {
      console.log('Sending update to API for dashboard style:', id);

      // First get the current dashboard data
      const currentDashboard = await DashboardService.getDashboard(id, false);
      if (!currentDashboard) {
        console.error('Dashboard not found for update');
        return null;
      }

      // Create update payload with updated style
      const updatePayload = {
        ...currentDashboard,
        style: style
      };

      // Use PUT as required by backend
      const response = await api.put(`/api/v1/dashboards/${id}`, updatePayload);
      return response.data;
    } catch (error) {
      console.error('Error updating dashboard style:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async list_dashboards(userId?: string, mockData: boolean = false): Promise<Dashboard[]> {
    if (mockData) {
      // Return mock dashboards for development/testing
      return [
        {
          id: 'dashboard-1',
          created_at: new Date().toISOString(),
          description: {
            en: {
              title: 'Sales Dashboard',
              description: 'Dashboard for tracking sales performance'
            }
          },
          is_anonymous: false,
          style: {
            layout: {
              logoUrl: 'https://example.com/logo.svg',
              templateName: 'default'
            },
            components: []
          }
        },
        {
          id: 'dashboard-2',
          created_at: new Date().toISOString(),
          description: {
            en: {
              title: 'Marketing Dashboard',
              description: 'Dashboard for tracking marketing campaigns'
            }
          },
          is_anonymous: false,
          style: {
            layout: {
              logoUrl: 'https://example.com/logo2.svg',
              templateName: 'default'
            },
            components: []
          }
        },
        {
          id: 'dashboard-3',
          created_at: new Date().toISOString(),
          description: {
            en: {
              title: 'Customer Support Dashboard',
              description: 'Dashboard for monitoring customer support tickets'
            }
          },
          is_anonymous: false,
          style: {
            layout: {
              logoUrl: 'https://example.com/logo3.svg',
              templateName: 'default'
            },
            components: []
          }
        }
      ];
    }

    try {
      let url = '/api/v1/dashboards';
      if (userId) {
        url += `?user_id=${userId}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      // Return empty array on error
      return [];
    }
  }

  static async cloneDashboard(id: string, newUserId?: string, mockData: boolean = false): Promise<Dashboard | null> {
    if (mockData) {
      const dashboard = mockDashboards.find(dashboard => dashboard.id === id);
      if (!dashboard) return null;

      // Create a new dashboard based on the existing one
      const clonedDashboard: Dashboard = {
        ...dashboard,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        user_id: newUserId || dashboard.user_id,
        is_anonymous: newUserId ? false : true,
        description: dashboard.description ? {
          en: {
            title: `Copy of ${dashboard.description.en.title}`,
            description: dashboard.description.en.description
          }
        } : undefined
      };

      return clonedDashboard;
    }

    try {
      // First get the dashboard to clone
      const dashboardToClone = await DashboardService.getDashboard(id, false);
      if (!dashboardToClone) {
        return null;
      }

      // Create a new dashboard based on the existing one
      const cloneData: DashboardCreateDto = {
        configuration: dashboardToClone.configuration,
        agents: dashboardToClone.agents,
        is_anonymous: newUserId ? false : true,
        user_id: newUserId || dashboardToClone.user_id,
        style: dashboardToClone.style,
        description: dashboardToClone.description ? {
          en: {
            title: `Copy of ${dashboardToClone.description.en.title}`,
            description: dashboardToClone.description.en.description
          }
        } : undefined
      };

      // Create the cloned dashboard
      const response = await api.post('/api/v1/dashboards', cloneData);
      return response.data;
    } catch (error) {
      console.error('Error cloning dashboard:', error);
      return null;
    }
  }
}

export default DashboardService;