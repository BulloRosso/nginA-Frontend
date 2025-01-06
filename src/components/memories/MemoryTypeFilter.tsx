// src/components/memories/MemoryTypeFilter.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { IconButton, Typography, Box, Tooltip, Popover, Slider } from '@mui/material';
import {
  School as SchoolIcon,
  Work as WorkIcon,
  FlightTakeoff as TravelIcon,
  Favorite as RelationshipsIcon,
  SportsEsports as HobbiesIcon,
  Pets as PetsIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Category } from '../../types/memory';
import { useTranslation } from 'react-i18next';
import { FilterButtonProps, MemoryTypeFilterProps } from '@/types/components';

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
            backgroundColor: isActive ? 'gold' : 'transparent',
            color: isActive ? 'white' : isDisabled ? 'action.disabled' : 'action.active',
            '&:hover': {
              backgroundColor: isActive ? 'darkgoldenrod' : 'action.hover'
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

const MemoryTypeFilter: React.FC<MemoryTypeFilterProps> = ({
  memoryCounts,
  activeFilters,
  onToggleFilter,
  memories,
  onYearRangeChange
}) => {
  const { t, i18n } = useTranslation(["common"]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([0, 0]);
  const [initialYearRange, setInitialYearRange] = useState<[number, number]>([0, 0]);
  const [forceUpdate, setForceUpdate] = useState(0);

  const categoryConfig = useMemo(() => ({
      [Category.CHILDHOOD]: {
        icon: <SchoolIcon />,
        label: t('common.categories.childhood')
      },
      [Category.CAREER]: {
        icon: <WorkIcon />,
        label: t('common.categories.career')
      },
      [Category.TRAVEL]: {
        icon: <TravelIcon />,
        label: t('common.categories.travel')
      },
      [Category.RELATIONSHIPS]: {
        icon: <RelationshipsIcon />,
        label: t('common.categories.relationships')
      },
      [Category.HOBBIES]: {
        icon: <HobbiesIcon />,
        label: t('common.categories.hobbies')
      },
      [Category.PETS]: {
        icon: <PetsIcon />,
        label: t('common.categories.pets')
      }
  }), [t, forceUpdate]); // Recreate when language changes
  
  
  // Calculate the year range from memories
  const { minYear, maxYear, hasMultipleYears } = useMemo(() => {
    const years = memories.map(m => new Date(m.timePeriod).getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    return {
      minYear: min,
      maxYear: max,
      hasMultipleYears: min !== max && !isNaN(min) && !isNaN(max)
    };
  }, [memories]);

  // Initialize the year ranges when memories change
  useEffect(() => {
    if (hasMultipleYears) {
      setYearRange([minYear, maxYear]);
      setInitialYearRange([minYear, maxYear]);
    }
  }, [minYear, maxYear, hasMultipleYears]);

  // Check if current range is different from initial range
  const isCustomRange = yearRange[0] !== initialYearRange[0] || yearRange[1] !== initialYearRange[1];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleYearRangeChange = (
    _event: Event,
    newValue: number | number[]
  ) => {
    const range = newValue as [number, number];
    setYearRange(range);
    if (onYearRangeChange) {
      onYearRangeChange(range);
    }
  };

  // Calculate filtered memories based on year range
  const yearFilteredMemories = useMemo(() => {
    return memories.filter(memory => {
      const year = new Date(memory.timePeriod).getFullYear();
      return year >= yearRange[0] && year <= yearRange[1];
    });
  }, [memories, yearRange]);

  // Calculate memory counts based on year-filtered memories
  const filteredMemoryCounts = useMemo(() => {
    const counts = Object.values(Category).reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<Category, number>);

    yearFilteredMemories.forEach(memory => {
      counts[memory.category]++;
    });

    return counts;
  }, [yearFilteredMemories]);

  const open = Boolean(anchorEl);

  return (
    <Box>
      {Object.entries(categoryConfig).map(([category, config]) => (
        <FilterButton
          key={category}
          icon={config.icon}
          count={filteredMemoryCounts[category as Category]}
          isActive={activeFilters.has(category as Category)}
          isDisabled={filteredMemoryCounts[category as Category] === 0}
          onClick={() => onToggleFilter(category as Category)}
          label={config.label}
        />
      ))}

      {hasMultipleYears && (
        <>
          <Box className="flex flex-col items-center mb-4">
            <Tooltip title={t('common.memoryfilter.year_filter')} placement="left">
              <span>
                <IconButton 
                  onClick={handleClick}
                  sx={{
                    backgroundColor: isCustomRange ? 'gold' : 'transparent',
                    '&:hover': {
                      backgroundColor: isCustomRange ? 'darkgoldenrod' : 'action.hover'
                    }
                  }}
                >
                  <CalendarIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
          >
            <Box sx={{ p: 2, width: 400 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 5,
                mt: 0,
              }}>
                <Typography>
                  {t('common.memoryfilter.year_range')}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleClose}
                  sx={{ ml: 1 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <div style={{marginLeft:'20px', marginRight:'20px'}}>
              <Slider
                value={yearRange}
                onChange={handleYearRangeChange}
                valueLabelDisplay="on"
                min={minYear}
                max={maxYear}
                marks={[
                  { value: minYear, label: minYear.toString() },
                  { value: maxYear, label: maxYear.toString() }
                ]}
              />
              </div>
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

export default MemoryTypeFilter;