import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress
} from '@mui/material';
import ConnectorArea from './ConnectorArea';
import ChainItem from './ChainItem';
import { Agent } from '../types/agent';
import { Team, TeamMember } from '../types/team';
import { TeamService } from '../services/teams';
import { AgentService } from '../services/agents';

interface ChainEditorProps {
  onChange?: (chainConfig: ChainConfig) => void;
  initialChain?: ChainConfig;
}

interface ChainAgentItem {
  agentId: string;
  connectorType: 'magic' | 'code';
  connectorJsCode: string;
  connectorValid: boolean;
}

interface ChainConfig {
  agents: ChainAgentItem[];
}

const ChainEditor: React.FC<ChainEditorProps> = ({ 
  onChange,
  initialChain 
}) => {
  console.log("ChainEditor rendering with initialChain:", initialChain);

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamAgents, setTeamAgents] = useState<Agent[]>([]);
  // Initialize chainAgents directly from props
  const [chainAgents, setChainAgents] = useState<ChainAgentItem[]>(
    initialChain?.agents && initialChain.agents.length > 0 
      ? [...initialChain.agents] 
      : []
  );
  const [selectedConnectorIndex, setSelectedConnectorIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const isDataLoaded = useRef(false);

  // Load team and agents data once on component mount
  useEffect(() => {
    if (!isDataLoaded.current) {
      isDataLoaded.current = true;

      const loadData = async () => {
        try {
          setLoading(true);

          // Load team
          const teamData = await TeamService.getTeam();
          console.log("Loaded team data:", teamData);
          setTeam(teamData);

          // Get agent IDs from team
          const agentIds = teamData.agents.members.map(member => member.agentId);
          console.log("Agent IDs from team:", agentIds);

          // Load team agents - only use real data
          const loadedAgents = await Promise.all(
            agentIds.map(async (agentId) => {
              try {
                // Try to get the specific agent with mockData=false
                const agent = await AgentService.getAgent(agentId, false);
                return agent;
              } catch (error) {
                console.error(`Error loading agent ${agentId}:`, error);
                return null;
              }
            })
          );

          const validAgents = loadedAgents.filter((agent): agent is Agent => agent !== null);
          console.log("Final loaded agents:", validAgents);
          console.log("Agent IDs in team:", validAgents.map(agent => agent.id));
          setTeamAgents(validAgents);

          // Only initialize with real agents that were loaded successfully
          if (validAgents.length > 0) {
            // Check if we need to initialize (empty chain)
            setChainAgents(currentChain => {
              if (currentChain.length === 0) {
                // If chain is empty, initialize with first agent
                console.log("Initializing chain with first agent:", validAgents[0].id);
                return [{
                  agentId: validAgents[0].id,
                  connectorType: 'magic',
                  connectorJsCode: '',
                  connectorValid: false
                }];
              } else if (initialChain && initialChain.agents.length > 0) {
                // Check if initialChain agents exist in the team
                const chainNeedsUpdate = initialChain.agents.some(chainAgent => 
                  !validAgents.some(teamAgent => teamAgent.id === chainAgent.agentId)
                );

                if (chainNeedsUpdate) {
                  console.log("Some initial agent IDs not found in team - removing invalid agents");
                  // Filter out agents that don't exist in the loaded agents
                  const validChainAgents = initialChain.agents.filter(chainAgent =>
                    validAgents.some(teamAgent => teamAgent.id === chainAgent.agentId)
                  );

                  // If no valid agents remain, use the first team agent
                  if (validChainAgents.length === 0) {
                    return [{
                      agentId: validAgents[0].id,
                      connectorType: 'magic',
                      connectorJsCode: '',
                      connectorValid: false
                    }];
                  }

                  return validChainAgents;
                }
              }

              return currentChain;
            });
          }

          setLoading(false);
        } catch (error) {
          console.error("Error loading data:", error);
          setLoading(false);
        }
      };

      loadData();
    }
  }, []);

  // Notify parent component when chain configuration changes, but not on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      if (onChange && !loading) {
        onChange({ agents: chainAgents });
      }
    }
  }, [chainAgents, onChange, loading]);

  // Get agent by ID - memoized to prevent recreating on every render
  const getAgentById = useCallback((id: string): Agent | undefined => {
    const agent = teamAgents.find(agent => agent.id === id);
    if (!agent) {
      console.log(`Agent not found - ID: ${id}`);
      console.log(`Available agent IDs: ${teamAgents.map(a => a.id).join(', ')}`);
    }
    return agent;
  }, [teamAgents]);

  // Find the next available agent to add to the chain
  const getNextAvailableAgent = useCallback((): Agent | undefined => {
    if (teamAgents.length === 0) return undefined;

    // Get all agent IDs currently in the chain
    const currentAgentIds = new Set(chainAgents.map(item => item.agentId));

    // Find the first agent not in the chain
    const availableAgent = teamAgents.find(agent => !currentAgentIds.has(agent.id));

    // If all agents are in the chain, return the first one
    return availableAgent || teamAgents[0];
  }, [teamAgents, chainAgents]);

  // Handle adding a new agent to the chain
  const handleAddAgent = useCallback(() => {
    const nextAgent = getNextAvailableAgent();
    if (!nextAgent) {
      console.log("No available agents to add");
      return;
    }

    const newChainAgent: ChainAgentItem = {
      agentId: nextAgent.id,
      connectorType: 'magic',
      connectorJsCode: '',
      connectorValid: false
    };

    setChainAgents(prevChainAgents => [...prevChainAgents, newChainAgent]);

    // Scroll to the end after adding
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }, 100);
  }, [getNextAvailableAgent]);

  // Handle switching to previous agent in the team list
  const handleSwitchToPrevAgent = useCallback((index: number) => {
    setChainAgents(prevChainAgents => {
      const currentAgentId = prevChainAgents[index].agentId;
      const currentAgentIndex = teamAgents.findIndex(agent => agent.id === currentAgentId);

      if (currentAgentIndex > 0) {
        const prevAgentId = teamAgents[currentAgentIndex - 1].id;
        const updatedChain = [...prevChainAgents];
        updatedChain[index] = {
          ...updatedChain[index],
          agentId: prevAgentId
        };
        return updatedChain;
      }

      return prevChainAgents;
    });
  }, [teamAgents]);

  // Handle switching to next agent in the team list
  const handleSwitchToNextAgent = useCallback((index: number) => {
    setChainAgents(prevChainAgents => {
      const currentAgentId = prevChainAgents[index].agentId;
      const currentAgentIndex = teamAgents.findIndex(agent => agent.id === currentAgentId);

      if (currentAgentIndex < teamAgents.length - 1) {
        const nextAgentId = teamAgents[currentAgentIndex + 1].id;
        const updatedChain = [...prevChainAgents];
        updatedChain[index] = {
          ...updatedChain[index],
          agentId: nextAgentId
        };
        return updatedChain;
      }

      return prevChainAgents;
    });
  }, [teamAgents]);

  // Toggle connector valid status
  const toggleConnectorValid = useCallback((index: number) => {
    setChainAgents(prevChainAgents => {
      const updatedChain = [...prevChainAgents];
      // Toggle connectorValid
      updatedChain[index] = {
        ...updatedChain[index],
        connectorValid: !updatedChain[index].connectorValid
      };

      // Show/hide connector area based on new valid state
      if (updatedChain[index].connectorValid) {
        setSelectedConnectorIndex(index);
      } else {
        setSelectedConnectorIndex(null);
      }

      return updatedChain;
    });
  }, []);

  // Handle connector type change
  const handleConnectorTypeChange = useCallback((index: number, type: 'magic' | 'code') => {
    setChainAgents(prevChainAgents => {
      const updatedChain = [...prevChainAgents];
      updatedChain[index] = {
        ...updatedChain[index],
        connectorType: type
      };
      return updatedChain;
    });
  }, []);

  // Handle connector code change
  const handleConnectorCodeChange = useCallback((index: number, code: string) => {
    setChainAgents(prevChainAgents => {
      const updatedChain = [...prevChainAgents];
      updatedChain[index] = {
        ...updatedChain[index],
        connectorJsCode: code
      };
      return updatedChain;
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={3} 
      sx={{
        p: 2,
        background: '#2d2e2e',
        backgroundImage: `radial-gradient(#c3c9d5 1px, transparent 0)`,
        backgroundSize: '24px 24px',
        borderRadius: 2,
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
        Agent Chain Editor
      </Typography>

      {/* Chain Items Container */}
      <Box
        ref={scrollContainerRef}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          pb: 2,
          gap: 2,
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
          }
        }}
      >
        {chainAgents.length === 0 ? (
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center', 
            py: 4, 
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <Typography variant="body1">
              No agents in the chain. Add your first agent by clicking below.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleAddAgent}
            >
              Add First Agent
            </Button>
          </Box>
        ) : (
          chainAgents.map((item, index) => {
            const agent = getAgentById(item.agentId);
            if (!agent) {
              console.log(`Agent not found for ID: ${item.agentId}`);
              return null;
            }

            return (
              <ChainItem
                key={`chain-item-${index}`}
                agent={agent}
                connectorType={item.connectorType}
                connectorJsCode={item.connectorJsCode}
                connectorValid={item.connectorValid}
                isLast={index === chainAgents.length - 1}
                onConnectorValidClick={() => toggleConnectorValid(index)}
                onUpClick={() => handleSwitchToPrevAgent(index)}
                onDownClick={() => handleSwitchToNextAgent(index)}
                onAddClick={handleAddAgent}
              />
            );
          })
        )}
      </Box>

      {/* Connector Area */}
      {selectedConnectorIndex !== null && chainAgents[selectedConnectorIndex] && (
        <ConnectorArea
          connectorType={chainAgents[selectedConnectorIndex].connectorType}
          connectorJsCode={chainAgents[selectedConnectorIndex].connectorJsCode}
          onTypeChange={(type) => handleConnectorTypeChange(selectedConnectorIndex, type)}
          onCodeChange={(code) => handleConnectorCodeChange(selectedConnectorIndex, code)}
          onClose={() => setSelectedConnectorIndex(null)}
        />
      )}
    </Paper>
  );
};

export default ChainEditor;