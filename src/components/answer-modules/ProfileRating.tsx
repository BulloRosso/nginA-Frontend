// src/components/answer-modules/ProfileRating.tsx
import React from 'react';
import { 
  Paper, 
  Grid, 
  Typography, 
  Box 
} from '@mui/material';
import { PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

interface ProfileRatingData {
  completeness: number;
  memories_count: number;
  memories_with_images: number;
  rating: string;
}

// Example data - replace with API call later
const mockData: ProfileRatingData = {
  completeness: 0.45,
  memories_count: 25,
  memories_with_images: 2,
  rating: "The overall sucess is quite impressive, keep on posting memories to be able to print a book."
};

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
            top: 10,
            left: 20,
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
      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', textAlign: 'center' }}>
        {sublabel}
      </Typography>
    </Box>
  );
};

export const ProfileRating: React.FC = () => {
  const { t } = useTranslation('supportbot');

  const calculateImagePercentage = (total: number, withImages: number): number => {
    if (total === 0) return 0;
    return (withImages / total) * 100;
  };

  return (
    <Paper sx={{ p: 2, maxWidth: '800px', mt: 1 }}>
      <Grid container spacing={3}>
        {/* First row with donut charts */}
        <Grid item xs={12} md={4}>
          <DonutChart
            value={mockData.completeness}
            label="45%"
            sublabel="Completeness"
            color="#1eb3b7"  // Your app's primary color
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DonutChart
            value={mockData.memories_count}
            maxValue={30}
            label={`${mockData.memories_count}`}
            sublabel={`Memories stored: ${mockData.memories_count}`}
            color="#ffd700"  // Gold color
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DonutChart
            value={mockData.memories_with_images}
            maxValue={mockData.memories_count}
            label={`${calculateImagePercentage(mockData.memories_count, mockData.memories_with_images)}%`}
            sublabel={`Memories with images: ${mockData.memories_with_images}`}
            color="#82ca9d"  // A nice green
          />
        </Grid>

        {/* Second row with rating text */}
        <Grid item xs={12}>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {mockData.rating}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProfileRating;