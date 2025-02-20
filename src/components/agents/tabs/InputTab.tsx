// components/agents/tabs/InputTab.tsx
import React from 'react';
import SchemaTable from '../SchemaTable';
import { Agent } from '../../../types/agent';

export const InputTab: React.FC<{ agent: Agent }> = ({ agent }) => (
  <SchemaTable schema={agent.input || {}} />
);