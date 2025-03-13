// src/types/dashboard.ts
export interface I18nContent {
  title: string;
  description: string;
}

export interface Description {
  en: I18nContent;
}

export interface Layout {
  logoUrl?: string;
  templateName?: string;
}

// Component settings interface
export interface ComponentSettings {
  [key: string]: any;
  agentId?: string;
  title?: string;
}

// Define component in configuration
export interface ConfigurationComponent {
  id: string;
  name: string;
  startCol: number;
  startRow: number;
  layout_cols?: number;  // Added property for column span
  layout_rows?: number;  // Added property for row span
  type?: string;
  react_component_name?: string;
  settings?: ComponentSettings;
  agentId?: string; // For backward compatibility
}

// Define the configuration interface
export interface DashboardConfiguration {
  components?: ConfigurationComponent[];
  refreshInterval?: number; 
  theme?: string;
  layout?: string;
  // Add any other configuration properties as needed
}

export interface Style {
  layout?: Layout;
  components?: any[];
}

export interface Dashboard {
  id: string;
  created_at: string;
  configuration?: DashboardConfiguration;  // Use the typed interface
  agents?: any;
  is_anonymous?: boolean;
  user_id?: string;
  description?: Description;
  style?: Style;
}

export interface DashboardCreateDto {
  configuration?: DashboardConfiguration;  // Use the typed interface
  agents?: any;
  is_anonymous?: boolean;
  user_id?: string;
  description?: Description;
  style?: Style;
}

export interface DashboardComponent {
  id: string;
  created_at: string;
  name?: string;
  type?: string;
  layout_cols?: number;
  layout_rows?: number;
  react_component_name?: string;
}

export interface DashboardComponentCreateDto {
  name?: string;
  type?: string;
  layout_cols?: number;
  layout_rows?: number;
  react_component_name?: string;
}