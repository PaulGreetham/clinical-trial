export interface Trial {
  id: string;
  name: string;
  description: string;
  phase: string;
  status: string;
  startDate: string;
  detailedDescription?: string;
  selected?: boolean; // For multi-selection functionality
  isNew?: boolean; // Add this for animation handling
  // Add other properties as needed
} 