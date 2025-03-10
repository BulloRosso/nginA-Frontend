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

export interface Style {
  layout?: Layout;
  components?: any[];
}

export interface Dashboard {
  id: string;
  created_at: string;
  configuration?: any;
  agents?: any;
  is_anonymous?: boolean;
  user_id?: string;
  description?: Description;
  style?: Style;
}

export interface DashboardCreateDto {
  configuration?: any;
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