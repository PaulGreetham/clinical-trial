export interface ClinicalTrialStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
    };
    phaseModule?: {
      phase?: string;
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    datesModule?: {
      startDate?: string;
    };
  };
}

export interface ClinicalTrialsApiResponse {
  studies: ClinicalTrialStudy[];
}

export interface ApiPaginationResponse {
  totalCount?: number;
  page?: number;
  pageSize?: number;
}
