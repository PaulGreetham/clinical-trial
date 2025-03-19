export interface Trial {
  id: string;
  name: string;
  description: string;
  phase: string;
  status: string;
  startDate: string;
  detailedDescription?: string;
  selected?: boolean;
  isNew?: boolean;
} 