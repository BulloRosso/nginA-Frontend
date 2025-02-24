// src/types/agent.ts
export interface I18nContent {
  de: string;
  en: string;
}

export interface SchemaField {
  type: string;
  description?: string;
}

export interface Agent {
  id: string;
  created_at: string;
  title: I18nContent;
  description: I18nContent;
  input?: JSONSchemaDefinition;
  output?: JSONSchemaDefinition;
  icon_svg?: string;
  credits_per_run: number;
  workflow_id?: string;
  stars: number;
  image_url?: string;
  max_execution_time_secs?: number;
  agent_endpoint?: string;
}

export interface AgentCreateDto {
  title: I18nContent;
  description: I18nContent;
  input?: Record<string, SchemaField>;
  output?: Record<string, SchemaField>;
  credits_per_run?: number;
  workflow_id?: string;
  stars?: number;
  image_url?: string;
  max_execution_time_secs?: number;
  agent_endpoint?: string;
}

// Define comprehensive JSON Schema types
export interface JSONSchemaDefinition {
  $schema?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchemaDefinition>;
  type?: string | string[];
  properties?: Record<string, JSONSchemaDefinition>;
  items?: JSONSchemaDefinition | JSONSchemaDefinition[];
  required?: string[];
  enum?: any[];
  const?: any;
  allOf?: JSONSchemaDefinition[];
  anyOf?: JSONSchemaDefinition[];
  oneOf?: JSONSchemaDefinition[];
  not?: JSONSchemaDefinition;
  if?: JSONSchemaDefinition;
  then?: JSONSchemaDefinition;
  else?: JSONSchemaDefinition;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  multipleOf?: number;
  description?: string;
  default?: any;
  examples?: any[];
  title?: string;
  additionalProperties?: boolean | JSONSchemaDefinition;
}