// src/components/memories/MemoryTypeFilter.tsx
import React from 'react';
import { IconButton, Typography, Box, Tooltip } from '@mui/material';
import {
  School as SchoolIcon,
  Work as WorkIcon,
  FlightTakeoff as TravelIcon,
  Favorite as RelationshipsIcon,
  SportsEsports as HobbiesIcon,
  Pets as PetsIcon
} from '@mui/icons-material';
import { Category } from '../../types/memory';

interface FilterButtonProps {
  icon: React.ReactElement;
  count: number;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
  label: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  icon,
  count,
  isActive,
  isDisabled,
  onClick,
  label
}) => (
  <Box className="flex flex-col items-center mb-4">
    <Tooltip title={label} placement="left">
      <span>
        <IconButton
          onClick={onClick}
          disabled={isDisabled}
          sx={{
            backgroundColor: isActive ? 'primary.main' : 'transparent',
            color: isActive ? 'white' : isDisabled ? 'action.disabled' : 'action.active',
            '&:hover': {
              backgroundColor: isActive ? 'primary.dark' : 'action.hover'
            },
            transition: 'all 0.2s'
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
    {!isDisabled && (
      <Typography
        variant="caption"
        color={isActive ? 'text.secondary' : 'text.primary'}
        sx={{ mt: 0.5 }}
      >
        ({count})
      </Typography>
    )}
  </Box>
);

export const categoryConfig = {
  [Category.CHILDHOOD]: {
    icon: <SchoolIcon />,
    label: 'Childhood'
  },
  [Category.CAREER]: {
    icon: <WorkIcon />,
    label: 'Career'
  },
  [Category.TRAVEL]: {
    icon: <TravelIcon />,
    label: 'Travel'
  },
  [Category.RELATIONSHIPS]: {
    icon: <RelationshipsIcon />,
    label: 'Relationships'
  },
  [Category.HOBBIES]: {
    icon: <HobbiesIcon />,
    label: 'Hobbies'
  },
  [Category.PETS]: {
    icon: <PetsIcon />,
    label: 'Pets'
  }
};

interface MemoryTypeFilterProps {
  memoryCounts: Record<Category, number>;
  activeFilters: Set<Category>;
  onToggleFilter: (category: Category) => void;
}

const MemoryTypeFilter: React.FC<MemoryTypeFilterProps> = ({
  memoryCounts,
  activeFilters,
  onToggleFilter
}) => {
  return (
    <Box>
      {Object.entries(categoryConfig).map(([category, config]) => (
        <FilterButton
          key={category}
          icon={config.icon}
          count={memoryCounts[category as Category]}
          isActive={activeFilters.has(category as Category)}
          isDisabled={memoryCounts[category as Category] === 0}
          onClick={() => onToggleFilter(category as Category)}
          label={config.label}
        />
      ))}
    </Box>
  );
};

export default MemoryTypeFilter;