// src/services/print.ts
import api from './api';

export interface PrintSettings {
  template: 'professional' | 'warm' | 'romantic';
  sortOrder: 'category' | 'timestamp';
}

export const PrintService = {
  submitPrintJob: async (profileId: string, settings: PrintSettings): Promise<{ message: string }> => {
    const response = await api.post(`/api/v1/print/${profileId}`, settings);
    return response.data;
  }
};

export default PrintService;