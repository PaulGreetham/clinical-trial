import { Component, OnInit, OnDestroy, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { Trial } from '../../types/trial.types';
import { Subscription, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-trial-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './trial-list.component.html',
  styleUrl: './trial-list.component.scss',
  encapsulation: ViewEncapsulation.Emulated
})
export class TrialListComponent implements OnInit, OnDestroy {
  trials: Trial[] = [];
  loading = false;
  error: string | null = null;
  timerActive = false;
  timerSubscription?: Subscription;
  
  selectedTrials: Set<string> = new Set();
  
  private apiService = inject(ApiService);
  private notificationsService = inject(NotificationsService);
  
  constructor() {}
  
  ngOnInit(): void {
    this.loadTrials();
  }
  
  ngOnDestroy(): void {
    this.stopTimer();
  }
  
  loadTrials(): void {
    this.loading = true;
    this.error = null;
    
    this.apiService.getRandomTrials().subscribe({
      next: (data) => {
        this.trials = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load trials: ' + (err.message || 'Unknown error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  toggleTimer(): void {
    if (this.timerActive) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }
  
  startTimer(): void {
    this.timerActive = true;
    
    this.fetchNewTrial();
    
    this.timerSubscription = interval(5000).subscribe({
      next: () => {
        this.fetchNewTrial();
      },
      error: (err) => {
      }
    });
  }
  
  stopTimer(): void {
    this.timerActive = false;
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }
  
  fetchNewTrial(): void {
    this.fetchTrialWithRetry(0);
  }
  
  private fetchTrialWithRetry(retryCount: number): void {
    this.apiService.getRandomSingleTrial().subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.processNewTrial(data[0], true);
        } else {
          setTimeout(() => this.fetchTrialWithRetry(retryCount + 1), 300);
        }
      },
      error: (err) => this.handleApiError(err)
    });
  }
  
  private processNewTrial(newTrial: Trial, allowDuplicate: boolean = true): void {
    const existingTrials = this.trials.map(t => ({ ...t, isNew: false }));
    
    const newTrialsArray = [
      { ...newTrial, isNew: true },
      ...existingTrials
    ];
    
    if (newTrialsArray.length > 10) {
      newTrialsArray.pop();
    }
    
    this.trials = newTrialsArray;
    
    setTimeout(() => {
      this.trials = this.trials.map(t => ({ ...t, isNew: false }));
    }, 3000);
  }
  
  private handleApiError(err: any): void {
    this.apiService.getRandomTrials(10).subscribe({
      next: (data) => this.processRandomTrial(data),
      error: (errFallback) => {
        this.error = `API Error: ${err.message || 'Unknown error'}`;
      }
    });
  }
  
  private processRandomTrial(data: Trial[]): void {
    if (data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      this.processNewTrial(data[randomIndex], true);
    }
  }
  
  toggleSelection(trialId: string): void {
    if (this.selectedTrials.has(trialId)) {
      this.selectedTrials.delete(trialId);
    } else {
      this.selectedTrials.add(trialId);
    }
  }
  
  isSelected(trialId: string): boolean {
    return this.selectedTrials.has(trialId);
  }
  
  addSelectedToFavorites(): void {
    const trialsToAdd = this.trials.filter(trial => this.selectedTrials.has(trial.id));
    if (trialsToAdd.length > 0) {
      this.apiService.addMultipleToFavorites(trialsToAdd).subscribe();
      this.selectedTrials.clear();
    }
  }
  
  addToFavorites(trial: Trial): void {
    this.apiService.addToFavorites(trial).subscribe();
  }
} 