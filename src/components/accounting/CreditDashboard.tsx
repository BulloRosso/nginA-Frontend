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
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  Today as DayIcon, 
  CalendarMonth as MonthIcon, 
  CalendarToday as YearIcon,
  AccountBalanceWallet as WalletIcon,
  ShoppingCart as SpendIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AccountingService } from '../../services/accounting';
import { AgentService } from '../../services/agents';
import { CreditReport, IntervalType, AgentUsage, BalanceResponse } from '../../types/accounting';
import { Agent } from '../../types/agent';

// Chart legend item component
interface LegendItemProps {
  color: string;
  name: string;
  value: number;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, name, value }) => {
  return (
    <ListItem sx={{ py: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 32 }}>
        <DotIcon sx={{ color }} />
      </ListItemIcon>
      <ListItemText 
        primary={
          <Typography variant="body2" noWrap>
            {name.length > 30 ? `${name.substring(0, 30)}...` : name}
          </Typography>
        }
        secondary={`${value} credits`}
      />
    </ListItem>
  );
};

// Top agents donut chart
interface TopAgentsChartProps {
  agentUsages: AgentUsage[];
  totalCredits: number;
}

const TopAgentsChart: React.FC<TopAgentsChartProps> = ({ agentUsages, totalCredits }) => {
  const theme = useTheme();

  // Chart colors - use theme palette with fallback colors
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d'
  ];

  // Sort agents by credit usage and take top 8
  const sortedAgents = [...agentUsages].sort((a, b) => b.total_credits - a.total_credits);
  const topAgents = sortedAgents.slice(0, 8);

  // Calculate sum of credits for agents outside top 8
  const otherAgentsCredits = sortedAgents.length > 8 
    ? sortedAgents.slice(8).reduce((sum, agent) => sum + agent.total_credits, 0) 
    : 0;

  // Prepare data for chart
  const chartData = [
    ...topAgents.map(agent => ({
      name: agent.agent_title_en || `Agent ${agent.agent_id.toString().substring(0, 8)}`,
      value: agent.total_credits
    }))
  ];

  // Add "Other" category if there are more than 8 agents
  if (otherAgentsCredits > 0) {
    chartData.push({
      name: 'Other Agents',
      value: otherAgentsCredits
    });
  }

  return (
    <Card sx={{ height: '100%', display: 'flex' }}>
      <CardContent sx={{ width: '100%', p:0, pt: 2 }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Chart - larger size for better visualization */}
          <Box sx={{ width: '60%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={1}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} credits`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Legend - with more space and better formatting */}
          <Box sx={{ width: '40%', pl: 3, overflowY: 'auto', maxHeight: 350 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Top Agents by Credit Usage
            </Typography>
            <List dense disablePadding>
              {chartData.map((entry, index) => (
                <LegendItem 
                  key={`legend-${index}`} 
                  color={COLORS[index % COLORS.length]} 
                  name={entry.name} 
                  value={entry.value} 
                />
              ))}
            </List>
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

  // Fetch report data when interval changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get usage report for the selected interval (now includes credits_remaining)
        const reportData = await AccountingService.getReport(interval);
        setReport(reportData);
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

      {/* Summary Cards and Chart in 33%/66% layout */}
      <Grid container spacing={3} sx={{ mb: 0 }}>
        {/* Left column: Summary Cards (33% width) */}
        <Grid item xs={12} md={4}>
          <Grid container direction="column" spacing={3}>
            <Grid item>
              <SummaryCard 
                title="Credits Spent" 
                value={report.total_credits} 
                icon={<SpendIcon />} 
                color={theme.palette.error.main} 
              />
            </Grid>
            <Grid item>
              <SummaryCard 
                title="Credits Remaining" 
                value={report.credits_remaining} 
                icon={<WalletIcon />} 
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Right column: Top Agents Chart (66% width) */}
        <Grid item xs={12} md={8}>
          {report.agents.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">
                No agent usage data for this time period
              </Typography>
            </Paper>
          ) : (
            <TopAgentsChart 
              agentUsages={report.agents} 
              totalCredits={report.total_credits} 
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreditDashboard;