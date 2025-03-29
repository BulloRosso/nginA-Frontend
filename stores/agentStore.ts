// src/store/agentStore.ts
import { create } from 'zustand';
import { Agent } from '../src/types/agent';
import { Team } from '../src/types/team';
import { TeamStatus } from '../src/types/operation';
import { CreditReport, IntervalType, AgentUsage, BalanceResponse } from '../types/accounting';
import { AgentService } from '../src/services/agents';
import { TeamService } from '../src/services/teams';
import { OperationService } from '../src/services/operations';
import { AccountingService } from '../src/services/accounting';

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

// Accounting state interface
interface AccountingState {
  creditReport: CreditReport | null;
  selectedInterval: IntervalType;
  isLoadingCredits: boolean;
  creditError: string | null;
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

  // Accounting state
  accountingState: AccountingState;

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
  addNewRunToAgent: (agentId: string, runId: string) => void;

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

  // Accounting actions
  fetchCreditReport: (interval?: IntervalType) => Promise<void>;
  setSelectedInterval: (interval: IntervalType) => void;
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

  // Accounting state
  accountingState: {
    creditReport: null,
    selectedInterval: 'month',
    isLoadingCredits: false,
    creditError: null
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

  addNewRunToAgent: (agentId: string, runId: string) => set((state) => {
    if (!state.teamStatus) return state;

    const now = new Date().toISOString();

    // Find the agent in teamStatus that corresponds to this agentId
    const updatedAgents = state.teamStatus.agents.map(agentStatus => {
      // Find the full agent to check ID
      const fullAgent = state.catalogAgents.find(a => 
        (a.title.en === agentStatus.title || Object.values(a.title).includes(agentStatus.title)) &&
        a.id === agentId
      );

      // If this is the agent we're updating
      if (fullAgent) {
        // Create a new lastRun object with pending status
        const newLastRun = {
          run_id: runId,
          startedAt: now,
          finishedAt: null,
          duration: 0,
          workflowId: agentStatus.lastRun?.workflowId || fullAgent.workflow_id || null,
          status: 'pending',
          results: {}
        };

        return {
          ...agentStatus,
          lastRun: newLastRun
        };
      }

      return agentStatus;
    });

    return {
      ...state,
      teamStatus: {
        ...state.teamStatus,
        agents: updatedAgents
      }
    };
  }),
  
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

      // Find the agent that corresponds to this run based on the agent_id in the payload
      const updatedAgents = state.teamStatus.agents.map(agent => {
        // Get the full agent details to check the ID
        const fullAgent = state.catalogAgents.find(a => 
          a.title.en === agent.title || Object.values(a.title).includes(agent.title)
        );

        // Check if this agent's ID matches the payload agent_id
        if (fullAgent && fullAgent.id === payload.new.agent_id) {
          // If the agent has never been run before or we're updating the current run
          if (!agent.lastRun || (agent.lastRun && agent.lastRun.run_id === payload.new.id)) {
            // Create a new lastRun object or update the existing one
            const updatedLastRun = {
              run_id: payload.new.id,
              startedAt: payload.new.created_at || agent.lastRun?.startedAt || new Date().toISOString(),
              finishedAt: payload.new.finished_at,
              status: payload.new.status,
              results: payload.new.results || agent.lastRun?.results || {},
              duration: payload.new.finished_at && agent.lastRun?.startedAt
                ? Math.round((new Date(payload.new.finished_at).getTime() - new Date(agent.lastRun.startedAt).getTime()) / 1000)
                : agent.lastRun?.duration || 0,
              workflowId: agent.lastRun?.workflowId
            };

            return {
              ...agent,
              lastRun: updatedLastRun
            };
          }
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
  }),

  // Accounting actions
  fetchCreditReport: async (interval) => {
    // Use the provided interval or the current one from state
    const intervalToUse = interval || get().accountingState.selectedInterval;

    set((state) => ({
      accountingState: {
        ...state.accountingState,
        isLoadingCredits: true,
        creditError: null
      }
    }));

    try {
      const reportData = await AccountingService.getReport(intervalToUse);

      set((state) => ({
        accountingState: {
          ...state.accountingState,
          creditReport: reportData,
          isLoadingCredits: false
        }
      }));
    } catch (err) {
      set((state) => ({
        accountingState: {
          ...state.accountingState,
          creditError: err instanceof Error ? err.message : 'Failed to fetch credit information',
          isLoadingCredits: false
        }
      }));
    }
  },

  setSelectedInterval: (interval) => set((state) => {
    // Only update if it's different from current interval
    if (interval !== state.accountingState.selectedInterval) {
      // Immediately trigger a data fetch with the new interval
      setTimeout(() => get().fetchCreditReport(interval), 0);

      return {
        accountingState: {
          ...state.accountingState,
          selectedInterval: interval
        }
      };
    }
    return state;
  })
}));

export default useAgentStore;