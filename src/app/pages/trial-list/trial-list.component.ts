import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { Trial } from '../../models/trial.model';
import { Subscription, interval, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

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
  
  // Selection for multi-favorite functionality
  selectedTrials: Set<string> = new Set();
  
  // Add these properties to the class
  private usedTrialIds: Set<string> = new Set(); // Track all trials we've already shown
  private maxRetries = 3;
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit(): void {
    this.loadTrials();
  }
  
  ngOnDestroy(): void {
    this.stopTimer();
  }
  
  loadTrials(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Loading trials...');
    
    this.apiService.getRandomTrials().subscribe({
      next: (data) => {
        console.log('Received trials:', data);
        this.trials = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading trials:', err);
        this.error = 'Failed to load trials: ' + (err.message || 'Unknown error');
        this.loading = false;
      },
      complete: () => {
        console.log('Trial loading complete');
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
    
    // Fetch a trial immediately when timer starts
    this.fetchNewTrial();
    
    // Then set up interval for subsequent trials
    this.timerSubscription = interval(5000).subscribe({
      next: () => {
        console.log('Timer interval triggered - fetching new trial');
        this.fetchNewTrial();
      },
      error: (err) => {
        console.error('Error in timer subscription:', err);
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
    console.log('Fetching new trial from API...');
    this.fetchTrialWithRetry(0);
  }
  
  private fetchTrialWithRetry(retryCount: number): void {
    // Bail out if we've retried too many times
    if (retryCount >= this.maxRetries) {
      console.error(`Max retry attempts (${this.maxRetries}) reached`);
      this.error = 'Failed to fetch a unique trial after multiple attempts.';
      this.loading = false;
      return;
    }
    
    // Just use our simple method
    this.apiService.getRandomSingleTrial().subscribe({
      next: (data) => {
        if (data.length > 0) {
          // Check if we've already seen this trial
          if (!this.usedTrialIds.has(data[0].id)) {
            this.processNewTrial(data[0]);
          } else {
            console.log(`Trial ${data[0].id} already exists, trying again...`);
            setTimeout(() => this.fetchTrialWithRetry(retryCount + 1), 300);
          }
        } else {
          console.warn('API returned empty data');
          setTimeout(() => this.fetchTrialWithRetry(retryCount + 1), 300);
        }
      },
      error: (err) => this.handleApiError(err)
    });
  }
  
  private processNewTrial(newTrial: Trial, allowDuplicate: boolean = false): void {
    if (!allowDuplicate) {
      // Add this ID to our used trials set
      this.usedTrialIds.add(newTrial.id);
    }
    
    console.log('New trial from API:', newTrial.id);
    
    // Mark all existing trials as not new
    const existingTrials = this.trials.map(t => ({ ...t, isNew: false }));
    
    // Add the new trial at the top
    const newTrialsArray = [
      { ...newTrial, isNew: true },
      ...existingTrials
    ];
    
    // If we have more than 10 trials, remove the oldest one (at the bottom)
    if (newTrialsArray.length > 10) {
      const removedTrial = newTrialsArray[newTrialsArray.length - 1];
      console.log(`Removing oldest trial: ID: ${removedTrial.id}`);
      newTrialsArray.pop();
    }
    
    this.trials = newTrialsArray;
    
    // Remove the 'isNew' flag after animation completes
    setTimeout(() => {
      this.trials = this.trials.map(t => ({ ...t, isNew: false }));
    }, 3000);
  }
  
  private handleApiError(err: any): void {
    console.error('Error fetching trial from API:', err);
    // If we hit an error, try with a different method rather than showing error to user
    const fallbackSearchType = Math.floor(Math.random() * 2); // Only use methods 0 or 1
    
    if (fallbackSearchType === 0) {
      this.apiService.getTrialsByCondition(["cancer", "diabetes", "alzheimer", "covid"][Math.floor(Math.random() * 4)])
        .subscribe({
          next: (data) => this.processRandomTrial(data),
          error: (errFallback) => {
            // Now show error as both attempts failed
            this.error = `API Error: ${err.message || 'Unknown error'}`;
          }
        });
    } else {
      this.apiService.getRandomTrials(10).subscribe({
        next: (data) => this.processRandomTrial(data),
        error: (errFallback) => {
          this.error = `API Error: ${err.message || 'Unknown error'}`;
        }
      });
    }
  }
  
  // Helper method to process a random trial from a batch
  private processRandomTrial(data: Trial[]): void {
    if (data.length > 0) {
      const uniqueTrials = data.filter(trial => !this.usedTrialIds.has(trial.id));
      if (uniqueTrials.length > 0) {
        const randomIndex = Math.floor(Math.random() * uniqueTrials.length);
        this.processNewTrial(uniqueTrials[randomIndex]);
      } else if (data.length > 0) {
        // If no unique trials, just pick one from all results
        const randomIndex = Math.floor(Math.random() * data.length);
        this.processNewTrial(data[randomIndex], true);
      }
    }
  }
  
  // Toggle selection of a trial for multi-favorite functionality
  toggleSelection(trialId: string): void {
    if (this.selectedTrials.has(trialId)) {
      this.selectedTrials.delete(trialId);
    } else {
      this.selectedTrials.add(trialId);
    }
  }
  
  // Check if a trial is selected
  isSelected(trialId: string): boolean {
    return this.selectedTrials.has(trialId);
  }
  
  // Add selected trials to favorites
  addSelectedToFavorites(): void {
    const trialsToAdd = this.trials.filter(trial => this.selectedTrials.has(trial.id));
    if (trialsToAdd.length > 0) {
      this.apiService.addMultipleToFavorites(trialsToAdd);
      this.selectedTrials.clear(); // Clear selection after adding
    }
  }
  
  // Add a single trial to favorites
  addToFavorites(trial: Trial): void {
    this.apiService.addToFavorites(trial);
  }
} 