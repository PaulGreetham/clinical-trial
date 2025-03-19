import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay, switchMap, take, retry } from 'rxjs/operators';
import { Trial } from '../types/trial.types';
import { environment } from '../../environments/environment';
import { NotificationsService } from './notifications.service';
import { ClinicalTrialsApiResponse } from '../types/api-responses.types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private notificationsService = inject(NotificationsService);
  
  private apiUrl = environment.apiUrl;
  
  private favoritesSubject = new BehaviorSubject<Trial[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  
  constructor() {
    this.loadFavoritesFromStorage();
  }
  
  getRandomTrials(count: number = 10): Observable<Trial[]> {
    const params = this.getBaseParams(count)
      .set('filter.overallStatus', ['RECRUITING', 'ACTIVE_NOT_RECRUITING'].join(','));
    
    return this.executeTrialsRequest(params, 'Failed to fetch random trials');
  }
  
  getRandomSingleTrial(): Observable<Trial[]> {
    // Generate a random search term prefix to get somewhat random results
    // Using common letters to ensure we get results
    const letters = ['a', 'b', 'c', 'd', 'e', 'i', 'o', 'm', 's', 't'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    
    const params = this.getBaseParams(1)
      .set('filter.overallStatus', ['RECRUITING', 'ACTIVE_NOT_RECRUITING'].join(','))
      .set('query.term', randomLetter);
    
    return this.executeTrialsRequest(params, 'Failed to fetch single trial')
      .pipe(retry(2));
  }
  
  private getBaseParams(pageSize: number = 10): HttpParams {
    return new HttpParams()
      .set('format', 'json')
      .set('pageSize', pageSize.toString())
      .set('countTotal', 'false')
      .set('fields', 'NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,OverallStatus,StartDate');
  }
  
  private executeTrialsRequest(params: HttpParams, errorMessage: string): Observable<Trial[]> {
    return this.http.get<ClinicalTrialsApiResponse>(`${this.apiUrl}/studies`, { 
      params,
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      map(response => {
        if (response?.studies && Array.isArray(response.studies)) {
          return this.mapStudiesToTrials(response.studies);
        }
        return [];
      }),
      catchError(error => this.handleApiError(error, errorMessage)),
      shareReplay(1)
    );
  }
  
  private handleApiError(error: any, operation: string): Observable<never> {
    console.error(`${operation}: ${error.message}`);
    return throwError(() => new Error(`${operation}: ${error.message}`));
  }
  
  addToFavorites(trial: Trial): Observable<void> {
    return this.favorites$.pipe(
      take(1),
      switchMap(currentFavorites => {
        if (!currentFavorites.some(fav => fav.id === trial.id)) {
          const updatedFavorites = [...currentFavorites, trial];
          this.favoritesSubject.next(updatedFavorites);
          this.saveFavoritesToStorage();
          this.notificationsService.showAddedToFavorites(trial);
        } else {
          this.notificationsService.showAlreadyInFavorites(trial);
        }
        return of(undefined);
      })
    );
  }
  
  addMultipleToFavorites(trials: Trial[]): Observable<void> {
    return this.favorites$.pipe(
      take(1),
      switchMap(currentFavorites => {
        let updated = false;
        let addedCount = 0;
        let updatedFavorites = [...currentFavorites];
        
        trials.forEach(trial => {
          if (!updatedFavorites.some(fav => fav.id === trial.id)) {
            updatedFavorites = [...updatedFavorites, trial];
            updated = true;
            addedCount++;
          }
        });
        
        if (updated) {
          this.favoritesSubject.next(updatedFavorites);
          this.saveFavoritesToStorage();
          this.notificationsService.showMultipleAddedToFavorites(addedCount);
        } else {
          this.notificationsService.showNoNewItemsAdded();
        }
        
        return of(undefined);
      })
    );
  }
  
  removeFromFavorites(trialId: string): Observable<void> {
    return this.favorites$.pipe(
      take(1),
      switchMap(currentFavorites => {
        const trialToRemove = currentFavorites.find(trial => trial.id === trialId);
        const updatedFavorites = currentFavorites.filter(trial => trial.id !== trialId);
        
        this.favoritesSubject.next(updatedFavorites);
        this.saveFavoritesToStorage();
        
        if (trialToRemove) {
          this.notificationsService.showRemovedFromFavorites(trialToRemove.name);
        }
        
        return of(undefined);
      })
    );
  }
  
  removeMultipleFromFavorites(trialIds: string[]): Observable<void> {
    return this.favorites$.pipe(
      take(1),
      switchMap(currentFavorites => {
        const updatedFavorites = currentFavorites.filter(trial => !trialIds.includes(trial.id));
        
        this.favoritesSubject.next(updatedFavorites);
        this.saveFavoritesToStorage();
        this.notificationsService.showMultipleRemovedFromFavorites(trialIds.length);
        
        return of(undefined);
      })
    );
  }
  
  private loadFavoritesFromStorage(): void {
    const storedFavorites = localStorage.getItem('trialFavorites');
    
    if (!storedFavorites) {
      return;
    }
    
    const isJsonString = (str: string): boolean => {
      return str[0] === '[' && str[str.length - 1] === ']';
    };
    
    if (!isJsonString(storedFavorites)) {
      localStorage.removeItem('trialFavorites');
      return;
    }
    
    const favorites = JSON.parse(storedFavorites);
    
    if (Array.isArray(favorites)) {
      this.favoritesSubject.next(favorites);
    } else {
      localStorage.removeItem('trialFavorites');
    }
  }
  
  private saveFavoritesToStorage(): void {
    localStorage.setItem('trialFavorites', JSON.stringify(this.favoritesSubject.value));
  }
  
  private mapStudiesToTrials(studies: any[]): Trial[] {
    return studies.map(study => this.mapStudyToTrial(study));
  }
  
  private mapStudyToTrial(study: any): Trial {
    const protocolSection = study?.protocolSection || {};
    const identificationModule = protocolSection?.identificationModule || {};
    const descriptionModule = protocolSection?.descriptionModule || {};
    const designModule = protocolSection?.designModule || {};
    const statusModule = protocolSection?.statusModule || {};
    
    const nctId = identificationModule?.nctId || 'unknown';
    const title = identificationModule?.briefTitle || 'Unknown Trial';
    const summary = descriptionModule?.briefSummary || 'No description available';
    const detailedDesc = descriptionModule?.detailedDescription || '';
    
    const phaseData = designModule?.phases;
    const phase = Array.isArray(phaseData) && phaseData.length > 0
      ? phaseData[0]
      : (phaseData || 'Not specified');
    
    const status = statusModule?.overallStatus || 'Unknown';
    const startDate = statusModule?.startDate || '';

    return {
      id: nctId,
      name: title,
      description: summary,
      phase: phase,
      status: status,
      startDate: startDate,
      detailedDescription: detailedDesc
    };
  }
} 