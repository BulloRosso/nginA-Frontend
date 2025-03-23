// src/store/agentStore.ts
import { create } from 'zustand';
import { Agent } from '../src/types/agent';
import { Team } from '../src/types/team';
import { TeamStatus } from '../src/types/operation';
import { AgentService } from '../src/services/agents';
import { TeamService } from '../src/services/teams';
import { OperationService } from '../src/services/operations';

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

// New interfaces for ChainEditor
interface ChainAgentItem {
  agentId: string;
  connectorType: 'magic' | 'code';
  connectorJsCode: string;
  connectorValid: boolean;
}

interface ChainConfig {
  agents: ChainAgentItem[];
}

interface BuilderState {
  promptText: string;
  chainConfig: ChainConfig;
  buildMode: 'chain' | 'dynamic';
  selectedTab: number;
}

interface AgentStore {
  // Builder state
  currentAgentChain: AgentChainItem[];
  currentAgentTransformations: AgentTransformation[];
  selectedTransformationAgentId: string | null;

  // Catalog state
  catalogAgents: Agent[];
  team: Team | null;
  isLoading: boolean;
  hasError: string | null;

  // Team Status state
  teamStatus: TeamStatus | null;
  teamStatusLoading: boolean;
  teamStatusError: string | null;

  // ChainEditor state
  builderState: BuilderState;

  // Builder actions
  setCurrentAgentChain: (chain: AgentChainItem[]) => void;
  setCurrentAgentTransformations: (transformations: AgentTransformation[]) => void;
  addAgentToChain: (agent: Agent) => void;
  removeAgentFromChain: (agentId: string) => void;
  updateAgentTransformation: (agentId: string, transformation: string) => void;
  setSelectedTransformationAgentId: (agentId: string | null) => void;

  // Catalog actions
  fetchAgentsAndTeam: () => Promise<void>;
  refreshAgentsAndTeam: () => Promise<void>;
  updateTeamMembership: (agentId: string) => Promise<void>;

  // Team Status actions
  fetchTeamStatus: () => Promise<void>;
  refreshTeamStatus: () => Promise<void>;
  updateAgentRun: (payload: any) => void;

  // ChainEditor actions
  updateChainConfig: (config: ChainConfig) => void;
  updatePromptText: (text: string) => void;
  updateBuildMode: (mode: 'chain' | 'dynamic') => void;
  updateSelectedTab: (tab: number) => void;
  addAgentToChainConfig: (agentId: string) => void;
  removeAgentFromChainConfig: (index: number) => void;
  updateAgentInChainConfig: (index: number, agentId: string) => void;
  updateConnectorType: (index: number, type: 'magic' | 'code') => void;
  updateConnectorCode: (index: number, code: string) => void;
  updateConnectorValid: (index: number, valid: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  // Builder state
  currentAgentChain: [],
  currentAgentTransformations: [],
  selectedTransformationAgentId: null,

  // Catalog state
  catalogAgents: [],
  team: null,
  isLoading: false,
  hasError: null,

  // Team Status state
  teamStatus: null,
  teamStatusLoading: false,
  teamStatusError: null,

  // ChainEditor state
  builderState: {
    promptText: "Enter your prompt for this agent (chain) here. It must satisfy the input requirements for the first agent in the chain.",
    chainConfig: {
      agents: []
    },
    buildMode: 'chain',
    selectedTab: 0
  },

  // Builder actions
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
        pre_process_transformations: transformation,
        post_process_transformations: transformation
      });
    }

    return { currentAgentTransformations: newTransformations };
  }),

  setSelectedTransformationAgentId: (agentId) => set({ 
    selectedTransformationAgentId: agentId 
  }),

  // Catalog actions
  fetchAgentsAndTeam: async () => {
    const state = get();
    // Skip if we already have data and aren't in a loading state
    if (state.catalogAgents.length > 0 && !state.isLoading) {
      return;
    }

    set({ isLoading: true, hasError: null });

    try {
      const [agentsData, teamData] = await Promise.all([
        AgentService.getAgents(),
        TeamService.getTeam()
      ]);

      set({ 
        catalogAgents: agentsData,
        team: teamData,
        isLoading: false
      });
    } catch (err) {
      set({ 
        hasError: err instanceof Error ? err.message : 'Failed to fetch data',
        isLoading: false
      });
    }
  },

  refreshAgentsAndTeam: async () => {
    set({ isLoading: true, hasError: null });

    try {
      const [agentsData, teamData] = await Promise.all([
        AgentService.getAgents(),
        TeamService.getTeam()
      ]);

      set({ 
        catalogAgents: agentsData,
        team: teamData,
        isLoading: false
      });
    } catch (err) {
      set({ 
        hasError: err instanceof Error ? err.message : 'Failed to refresh data',
        isLoading: false
      });
    }
  },

  updateTeamMembership: async (agentId) => {
    const state = get();
    if (!state.team) return;

    try {
      const isAgentInTeam = state.team.agents.members.some(
        member => member.agentId === agentId
      );

      let updatedTeam;
      if (isAgentInTeam) {
        // Remove agent from team
        updatedTeam = await TeamService.removeAgent(agentId);
      } else {
        // Add agent to team
        updatedTeam = await TeamService.addAgent(agentId);
      }

      set({ team: updatedTeam });

      // After updating team membership, refresh team status too
      get().refreshTeamStatus();
    } catch (err) {
      set({ 
        hasError: err instanceof Error ? err.message : 'Failed to update team'
      });
    }
  },

  // Team Status actions
  fetchTeamStatus: async () => {
    const state = get();
    // Skip if we already have data and aren't in a loading state
    if (state.teamStatus && !state.teamStatusLoading) {
      return;
    }

    set({ teamStatusLoading: true, teamStatusError: null });

    try {
      const statusData = await OperationService.getTeamStatus();

      set({ 
        teamStatus: statusData,
        teamStatusLoading: false
      });
    } catch (err) {
      set({ 
        teamStatusError: err instanceof Error ? err.message : 'Failed to fetch team status',
        teamStatusLoading: false
      });
    }
  },

  refreshTeamStatus: async () => {
    set({ teamStatusLoading: true, teamStatusError: null });

    try {
      const statusData = await OperationService.getTeamStatus();

      set({ 
        teamStatus: statusData,
        teamStatusLoading: false
      });
    } catch (err) {
      set({ 
        teamStatusError: err instanceof Error ? err.message : 'Failed to refresh team status',
        teamStatusLoading: false
      });
    }
  },

  updateAgentRun: (payload) => {
    if (!payload.new) return;

    set((state) => {
      if (!state.teamStatus) return state;

      // Find the agent that corresponds to this run
      const updatedAgents = state.teamStatus.agents.map(agent => {
        // Check if this agent's lastRun should be updated (by matching agent_id)
        if (agent.lastRun && agent.lastRun.run_id === payload.new.id) {
          return {
            ...agent,
            lastRun: {
              ...agent.lastRun,
              status: payload.new.status,
              results: payload.new.results,
              finishedAt: payload.new.finished_at,
              duration: payload.new.finished_at 
                ? Math.round((new Date(payload.new.finished_at).getTime() - new Date(agent.lastRun.startedAt).getTime()) / 1000)
                : agent.lastRun.duration
            }
          };
        }
        return agent;
      });

      return {
        ...state,
        teamStatus: {
          ...state.teamStatus,
          agents: updatedAgents
        }
      };
    });
  },

  // ChainEditor actions
  updateChainConfig: (config) => set((state) => ({
    builderState: {
      ...state.builderState,
      chainConfig: config
    }
  })),

  updatePromptText: (text) => set((state) => ({
    builderState: {
      ...state.builderState,
      promptText: text
    }
  })),

  updateBuildMode: (mode) => set((state) => ({
    builderState: {
      ...state.builderState,
      buildMode: mode
    }
  })),

  updateSelectedTab: (tab) => set((state) => ({
    builderState: {
      ...state.builderState,
      selectedTab: tab
    }
  })),

  addAgentToChainConfig: (agentId) => set((state) => {
    const newAgent: ChainAgentItem = {
      agentId,
      connectorType: 'magic',
      connectorJsCode: '',
      connectorValid: true
    };

    return {
      builderState: {
        ...state.builderState,
        chainConfig: {
          agents: [...state.builderState.chainConfig.agents, newAgent]
        }
      }
    };
  }),

  removeAgentFromChainConfig: (index) => set((state) => {
    const newAgents = [...state.builderState.chainConfig.agents];
    newAgents.splice(index, 1);

    return {
      builderState: {
        ...state.builderState,
        chainConfig: {
          agents: newAgents
        }
      }
    };
  }),

  updateAgentInChainConfig: (index, agentId) => set((state) => {
    const newAgents = [...state.builderState.chainConfig.agents];
    newAgents[index] = {
      ...newAgents[index],
      agentId
    };

    return {
      builderState: {
        ...state.builderState,
        chainConfig: {
          agents: newAgents
        }
      }
    };
  }),

  updateConnectorType: (index, type) => set((state) => {
    const newAgents = [...state.builderState.chainConfig.agents];
    newAgents[index] = {
      ...newAgents[index],
      connectorType: type
    };

    return {
      builderState: {
        ...state.builderState,
        chainConfig: {
          agents: newAgents
        }
      }
    };
  }),

  updateConnectorCode: (index, code) => set((state) => {
    const newAgents = [...state.builderState.chainConfig.agents];
    newAgents[index] = {
      ...newAgents[index],
      connectorJsCode: code
    };

    return {
      builderState: {
        ...state.builderState,
        chainConfig: {
          agents: newAgents
        }
      }
    };
  }),

  updateConnectorValid: (index, valid) => set((state) => {
    const newAgents = [...state.builderState.chainConfig.agents];
    newAgents[index] = {
      ...newAgents[index],
      connectorValid: valid
    };

    return {
      builderState: {
        ...state.builderState,
        chainConfig: {
          agents: newAgents
        }
      }
    };
  })
}));

export default useAgentStore;