import { SxProps } from '@mui/system';

export interface FilterButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export interface MemoryTypeFilterProps {
  selectedTypes: string[];
  onTypeSelect: (type: string) => void;
}

export interface AudioWaveformProps {
  isRecording: boolean;
}

export interface CustomTabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
  sx?: SxProps;
}