// components/agents/tabs/OutputTab.tsx
import React from 'react';
import SchemaTable from '../SchemaTable';
import { Agent } from '../../../types/agent';

export const OutputTab: React.FC<{ agent: Agent }> = ({ agent }) => (
  <SchemaTable schema={agent.output || {}} />
);