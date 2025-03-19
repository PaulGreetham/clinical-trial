import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Trial } from '../models/trial.model';
import { environment } from '../../environments/environment';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api'; // This will be redirected via your proxy.conf.json
  private notificationsService = inject(NotificationsService);
  
  // Store favorites in a BehaviorSubject for reactive updates
  private favoritesSubject = new BehaviorSubject<Trial[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  
  // Get random trials from ClinicalTrials.gov API
  getRandomTrials(count: number = 10): Observable<Trial[]> {
    // Try direct access to the API to avoid proxy issues
    const directApiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    
    // Set up the API parameters according to ClinicalTrials.gov API documentation
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', count.toString())
      .set('countTotal', 'false')
      // Only include necessary fields
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      // Use a more specific query for better results
      .set('filter.overallStatus', ['RECRUITING', 'ACTIVE_NOT_RECRUITING'].join(','));
      
    console.log('Making direct request to ClinicalTrials.gov API:', directApiUrl);
    console.log('With parameters:', params.toString());
      
    // Build the full URL for logging purposes
    const fullUrl = `${directApiUrl}?${params.toString()}`;
    console.log('Full request URL:', fullUrl);
      
    return this.http.get(directApiUrl, { 
      params,
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map((response: any) => {
        console.log('Received API response:', response);
        
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          console.error('Unexpected API response structure:', response);
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  // Get a single trial by ID
  getTrialById(nctId: string): Observable<Trial> {
    return this.http.get<any>(`${this.baseUrl}/studies/${nctId}`)
      .pipe(
        map(study => this.mapStudyToTrial(study))
      );
  }
  
  // Add a trial to favorites
  addToFavorites(trial: Trial): void {
    const currentFavorites = this.favoritesSubject.value;
    // Check if already in favorites
    if (!currentFavorites.some(fav => fav.id === trial.id)) {
      this.favoritesSubject.next([...currentFavorites, trial]);
      // Optionally save to localStorage for persistence
      this.saveFavoritesToStorage();
      
      // Show success notification
      this.notificationsService.showAddedToFavorites(trial);
    } else {
      // Show "already in favorites" notification
      this.notificationsService.showAlreadyInFavorites(trial);
    }
  }
  
  // Add multiple trials to favorites
  addMultipleToFavorites(trials: Trial[]): void {
    let currentFavorites = this.favoritesSubject.value;
    let updated = false;
    let addedCount = 0;
    
    trials.forEach(trial => {
      if (!currentFavorites.some(fav => fav.id === trial.id)) {
        currentFavorites = [...currentFavorites, trial];
        updated = true;
        addedCount++;
      }
    });
    
    if (updated) {
      this.favoritesSubject.next(currentFavorites);
      this.saveFavoritesToStorage();
      
      // Show success notification for multiple items
      this.notificationsService.showMultipleAddedToFavorites(addedCount);
    } else {
      // All trials were already in favorites
      this.notificationsService.showNoNewItemsAdded();
    }
  }
  
  // Remove a trial from favorites
  removeFromFavorites(trialId: string): void {
    const currentFavorites = this.favoritesSubject.value;
    const trial = currentFavorites.find(t => t.id === trialId);
    const updatedFavorites = currentFavorites.filter(t => t.id !== trialId);
    
    this.favoritesSubject.next(updatedFavorites);
    this.saveFavoritesToStorage();
    
    // Show removal notification
    if (trial) {
      this.notificationsService.showRemovedFromFavorites(trial.name);
    }
  }
  
  // Remove multiple trials from favorites
  removeMultipleFromFavorites(trialIds: string[]): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(trial => !trialIds.includes(trial.id));
    
    this.favoritesSubject.next(updatedFavorites);
    this.saveFavoritesToStorage();
    
    // Show removal notification for multiple items
    this.notificationsService.showMultipleRemovedFromFavorites(trialIds.length);
  }
  
  // Get all favorites
  getFavorites(): Trial[] {
    return this.favoritesSubject.value;
  }
  
  // Load favorites from storage on service initialization
  loadFavoritesFromStorage(): void {
    const storedFavorites = localStorage.getItem('trialFavorites');
    if (storedFavorites) {
      try {
        const favorites = JSON.parse(storedFavorites);
        this.favoritesSubject.next(favorites);
      } catch (e) {
        console.error('Error parsing favorites from localStorage', e);
      }
    }
  }
  
  // Save favorites to localStorage for persistence
  private saveFavoritesToStorage(): void {
    localStorage.setItem('trialFavorites', JSON.stringify(this.favoritesSubject.value));
  }
  
  // Map API response to our Trial model
  private mapStudiesToTrials(studies: any[]): Trial[] {
    return studies.map(study => this.mapStudyToTrial(study));
  }
  
  private mapStudyToTrial(study: any): Trial {
    try {
      // Handle ClinicalTrials.gov API v2 structure
      const nctId = study.protocolSection?.identificationModule?.nctId || 'unknown';
                   
      const title = study.protocolSection?.identificationModule?.briefTitle || 
                   'Unknown Trial';
                   
      const summary = study.protocolSection?.descriptionModule?.briefSummary || 
                     'No description available';
                     
      const detailedDesc = study.protocolSection?.descriptionModule?.detailedDescription || '';
                          
      // Handle phase array or string
      const phaseData = study.protocolSection?.designModule?.phases;
      const phase = Array.isArray(phaseData) 
        ? phaseData[0] 
        : (phaseData || 'Not specified');
        
      const status = study.protocolSection?.statusModule?.overallStatus || 'Unknown';
                      
      const startDate = study.protocolSection?.statusModule?.startDate || '';

      return {
        id: nctId,
        name: title,
        description: summary,
        phase: phase,
        status: status,
        startDate: startDate,
        detailedDescription: detailedDesc
      };
    } catch (e) {
      console.error('Error mapping study to trial:', e, study);
      return {
        id: 'unknown',
        name: 'Error Processing Trial',
        description: 'There was an error processing this trial data.',
        phase: 'Unknown',
        status: 'Unknown',
        startDate: ''
      };
    }
  }
  
  // Get random trials with offset for better randomization
  getRandomTrialWithOffset(count: number = 1, offset: number = 0): Observable<Trial[]> {
    const directApiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    
    // Set up the API parameters with offset
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', count.toString())
      .set('offset', offset.toString())
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      .set('filter.overallStatus', ['RECRUITING', 'ACTIVE_NOT_RECRUITING'].join(','));
      
    console.log('Making direct request with offset:', offset);
      
    return this.http.get(directApiUrl, { 
      params,
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map((response: any) => {
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          console.error('Unexpected API response structure:', response);
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  // Get random trials with a timestamp to avoid caching
  getRandomTrialsWithTimestamp(count: number = 10, randomValue: number = 0): Observable<Trial[]> {
    const directApiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    
    // Set up the API parameters with a timestamp to avoid caching
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', count.toString())
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      .set('filter.overallStatus', ['RECRUITING', 'ACTIVE_NOT_RECRUITING'].join(','))
      // Add timestamp and random parameter to avoid identical responses
      .set('_', Date.now().toString())
      .set('rand', randomValue.toString());
      
    console.log('Making timestamped request to ClinicalTrials.gov API');
      
    return this.http.get(directApiUrl, { 
      params,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).pipe(
      map((response: any) => {
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          console.error('Unexpected API response structure:', response);
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  // Get trials by condition
  getTrialsByCondition(condition: string): Observable<Trial[]> {
    const directApiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    
    // Set up parameters with condition
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', '10')
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      .set('query.term', condition);
      
    console.log(`Making request with condition: ${condition}`);
      
    return this.http.get(directApiUrl, { 
      params,
      headers: { 'Accept': 'application/json' }
    }).pipe(
      map((response: any) => {
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  // Get trials by status
  getTrialsByStatus(statuses: string[]): Observable<Trial[]> {
    const directApiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    
    // Set up parameters with status filter
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', '10')
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      .set('filter.overallStatus', statuses.join(','));
      
    console.log(`Making request with statuses: ${statuses.join(',')}`);
      
    return this.http.get(directApiUrl, { params }).pipe(
      map((response: any) => {
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  // Get trials by phase
  getTrialsByPhase(phase: string): Observable<Trial[]> {
    const directApiUrl = 'https://clinicaltrials.gov/api/v2/studies';
    
    // Set up parameters with phase filter
    // The ClinicalTrials.gov API doesn't accept spaces in phase names
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', '10')
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      .set('filter.phase', phase);
      
    console.log(`Making request with phase: ${phase}`);
      
    return this.http.get(directApiUrl, { 
      params,
      headers: { 'Accept': 'application/json' }
    }).pipe(
      map((response: any) => {
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          console.error('Unexpected API response structure:', response);
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  // Update this method to be our main method for getting a single random trial
  getRandomSingleTrial(): Observable<Trial[]> {
    // Use the proxy path instead of direct API calls to avoid CORS issues
    const apiUrl = `${this.baseUrl}/studies`;
    
    // Simple params that reliably work
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', '1') // Just get one trial
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate')
      // Random offset to get different trials
      .set('offset', Math.floor(Math.random() * 1000).toString())
      // Add timestamp to avoid caching
      .set('_', Date.now().toString());
      
    console.log('Making simple request for a single trial');
      
    return this.http.get(apiUrl, { params }).pipe(
      map((response: any) => {
        if (response && response.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        } else {
          console.error('Unexpected API response structure:', response);
          throw new Error('Invalid API response format');
        }
      })
    );
  }
  
  constructor() {
    // Load favorites from localStorage when service is created
    this.loadFavoritesFromStorage();
  }
} 