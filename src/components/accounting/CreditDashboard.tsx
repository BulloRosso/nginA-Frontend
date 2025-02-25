// src/components/accounting/CreditDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  Today as DayIcon, 
  CalendarMonth as MonthIcon, 
  CalendarToday as YearIcon,
  AccountBalanceWallet as WalletIcon,
  ShoppingCart as SpendIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AccountingService } from '../../services/accounting';
import { AgentService } from '../../services/agents';
import { CreditReport, IntervalType, AgentUsage, BalanceResponse } from '../../types/accounting';
import { Agent } from '../../types/agent';

// Donut chart component reused from ProfileRating
interface DonutChartProps {
  value: number;
  maxValue?: number;
  label: string;
  sublabel: string;
  color: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ value, maxValue = 1, label, sublabel, color }) => {
  // Calculate percentage
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);

  // Prepare data for Recharts
  const data = [
    { value: percentage },
    { value: 100 - percentage }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 160, height: 160 }}>
        <PieChart width={160} height={160}>
          <Pie
            data={data}
            cx={80}
            cy={80}
            innerRadius={60}
            outerRadius={75}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#f0f0f0" />
          </Pie>
        </PieChart>
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 10,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold' }}
          >
            {percentage}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
        {sublabel}
      </Typography>
    </Box>
  );
};

// Agent credit usage donut chart
interface AgentCreditDonutProps {
  agent: Agent;
  usage: AgentUsage;
  maxCredits: number;
}

const AgentCreditDonut: React.FC<AgentCreditDonutProps> = ({ agent, usage, maxCredits }) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {agent.title.en}
          </Typography>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: usage.total_credits },
                    { value: maxCredits - usage.total_credits }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill={theme.palette.primary.main} />
                  <Cell fill="#f0f0f0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {usage.total_credits}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                credits
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {usage.run_count} runs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg: {usage.avg_credits_per_run.toFixed(1)} credits/run
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Summary card component
interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
      <CardContent sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ 
            mr: 2, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: `${color}20`,
            borderRadius: '50%',
            p: 1.5
          }}>
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { fontSize: 28, color } 
            })}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main component
export const CreditDashboard: React.FC = () => {

  const { t } = useTranslation();
  const theme = useTheme();

  const [interval, setInterval] = useState<IntervalType>('month');
  const [report, setReport] = useState<CreditReport | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [agents, setAgents] = useState<{ [key: string]: Agent }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle interval change
  const handleIntervalChange = (
    _event: React.MouseEvent<HTMLElement>,
    newInterval: IntervalType,
  ) => {
    if (newInterval !== null) {
      setInterval(newInterval);
    }
  };

  // Fetch agent details to display names
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsList = await AgentService.getAgents();
        const agentsMap: { [key: string]: Agent } = {};
        agentsList.forEach(agent => {
          agentsMap[agent.id] = agent;
        });
        setAgents(agentsMap);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agent information');
      }
    };

    fetchAgents();
  }, []);

  // Fetch report data when interval changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get usage report for the selected interval
        const reportData = await AccountingService.getReport(interval);
        setReport(reportData);

        // Also fetch current balance
        const balanceData = await AccountingService.getBalance(reportData.user_id);
        setBalance(balanceData);
      } catch (err) {
        console.error('Error fetching credit data:', err);
        setError('Failed to load credit information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [interval]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body2">
          Please check that you're properly logged in with a valid account.
        </Typography>
      </Paper>
    );
  }

  if (!report) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="warning.main">
          No credit usage data available.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header and interval selector */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5">Where did all your credits go?</Typography>

        <ToggleButtonGroup
          value={interval}
          exclusive
          onChange={handleIntervalChange}
          aria-label="time interval"
          size="small"
        >
          <ToggleButton value="day" aria-label="day view">
            <DayIcon sx={{ mr: 0.5 }} />
            Day
          </ToggleButton>
          <ToggleButton value="month" aria-label="month view">
            <MonthIcon sx={{ mr: 0.5 }} />
            Month
          </ToggleButton>
          <ToggleButton value="year" aria-label="year view">
            <YearIcon sx={{ mr: 0.5 }} />
            Year
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        <Grid item xs={12} md={4} lg={4}>
          <SummaryCard 
            title="Credits Spent" 
            value={report.total_credits} 
            icon={<SpendIcon />} 
            color={theme.palette.error.main} 
          />
        </Grid>
        
        <Grid item xs={12} md={4} lg={4}>
          {report.agents.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No agent usage data for this time period
              </Typography>
            </Paper>
          ) } 
          {report.agents.map((agentUsage) => {
            const agent = agents[agentUsage.agent_id];
            if (!agent) return null;

            return (
                 <AgentCreditDonut 
                  agent={agent} 
                  usage={agentUsage} 
                  maxCredits={Math.max(agentUsage.total_credits * 1.5, 100)} 
                />
          
            );
          })}
         
          
        </Grid>
        
        <Grid item xs={12} md={4} lg={4}>
          <SummaryCard 
            title="Credits Remaining" 
            value={balance ? balance.balance : 'Unknown'} 
            icon={<WalletIcon />} 
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>


      
    </Box>
  );
};

export default CreditDashboard;