export interface ClinicalTrialsApiResponse {
  studies: any[];
}

export interface ApiPaginationResponse {
  totalCount?: number;
  page?: number;
  pageSize?: number;
} 