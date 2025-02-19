// src/types/team.ts
export interface TeamMember {
  agentId: string;
}

export interface Team {
  id: string;
  created_at: string;
  owner_id: string;
  agents: {
    members: TeamMember[];
  };
}