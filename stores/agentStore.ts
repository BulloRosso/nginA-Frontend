// src/store/agentStore.ts
import { create } from 'zustand';
import { Agent } from '../src/types/agent';

interface AgentChainItem {
  agent_id: string;
  agent_title: string;
  agent_description: string;
  icon_svg: string;
}

interface AgentTransformation {
  agent_id: string;
  pre_process_transformations: string;
  post_process_transformations: string;
}

interface AgentStore {
  currentAgentChain: AgentChainItem[];
  currentAgentTransformations: AgentTransformation[];
  setCurrentAgentChain: (chain: AgentChainItem[]) => void;
  setCurrentAgentTransformations: (transformations: AgentTransformation[]) => void;
  addAgentToChain: (agent: Agent) => void;
  removeAgentFromChain: (agentId: string) => void;
  updateAgentTransformation: (agentId: string, transformation: string) => void;
  // Current selected agent in the transformation tester
  selectedTransformationAgentId: string | null;
  setSelectedTransformationAgentId: (agentId: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  currentAgentChain: [],
  currentAgentTransformations: [],
  selectedTransformationAgentId: null,

  setCurrentAgentChain: (chain) => set({ currentAgentChain: chain }),

  setCurrentAgentTransformations: (transformations) => {
    set({ 
      currentAgentTransformations: transformations,
      // Set the first agent as selected if there's at least one transformation
      selectedTransformationAgentId: transformations.length > 0 
        ? transformations[0].agent_id 
        : null
    });
  },

  addAgentToChain: (agent) => set((state) => {
    const agentExists = state.currentAgentChain.some(item => item.agent_id === agent.id);
    if (agentExists) return state;

    const newChainItem: AgentChainItem = {
      agent_id: agent.id,
      agent_title: agent.title.en,
      agent_description: agent.description.en,
      icon_svg: agent.icon_svg
    };

    return { currentAgentChain: [...state.currentAgentChain, newChainItem] };
  }),

  removeAgentFromChain: (agentId) => set((state) => ({
    currentAgentChain: state.currentAgentChain.filter(item => item.agent_id !== agentId)
  })),

  updateAgentTransformation: (agentId, transformation) => set((state) => {
    const existingIndex = state.currentAgentTransformations.findIndex(
      item => item.agent_id === agentId
    );

    let newTransformations = [...state.currentAgentTransformations];

    if (existingIndex >= 0) {
      // Update existing transformation
      newTransformations[existingIndex] = {
        ...newTransformations[existingIndex],
        pre_process_transformations: transformation,
        post_process_transformations: transformation
      };
    } else {
      // Add new transformation
      newTransformations.push({
        agent_id: agentId,
        pre_process_tranformations: transformation,
        post_process_transformations: transformation
      });
    }

    return { currentAgentTransformations: newTransformations };
  }),

  setSelectedTransformationAgentId: (agentId) => set({ 
    selectedTransformationAgentId: agentId 
  })
}));

export default useAgentStore;