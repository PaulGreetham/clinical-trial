import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { Trial } from '../../models/trial.model';
import { Subscription, interval } from 'rxjs';
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
    console.log('Fetching new trial...');
    
    // When in mock mode, create a unique trial on each refresh
    if (environment.useTestData) {
      // Mock implementation remains the same, but add console logs
      console.log('Using mock data for new trial');
      
      const mockStatuses = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING'];
      const mockPhases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Not Applicable'];
      
      // Use current timestamp to ensure unique naming/data
      const now = new Date();
      const timeString = now.toLocaleTimeString(); // HH:MM:SS format
      
      const randomTrial: Trial = {
        id: 'NCT' + Math.floor(10000000 + Math.random() * 90000000),
        name: `Auto-Generated Trial (${timeString})`,
        description: `This is an automatically generated trial created by the auto-refresh timer at ${timeString}.`,
        phase: mockPhases[Math.floor(Math.random() * mockPhases.length)],
        status: mockStatuses[Math.floor(Math.random() * mockStatuses.length)],
        startDate: now.toISOString().slice(0, 10),
        detailedDescription: `Additional details for this auto-generated clinical trial. Created at: ${now.toISOString()}`
      };
      
      console.log('Created new mock trial:', randomTrial.id);
      
      // Add the new trial to the beginning of the array and flag it as new for animation
      const newTrials = [{ ...randomTrial, isNew: true }, ...this.trials.map(t => ({ ...t, isNew: false }))];
      
      // If we have more than 10 trials, remove the oldest one
      this.trials = newTrials.length > 10 ? newTrials.slice(0, 10) : newTrials;
      
      // Remove the 'isNew' flag after animation completes
      setTimeout(() => {
        this.trials = this.trials.map(t => ({ ...t, isNew: false }));
      }, 3000);
      
      return;
    }
    
    // API mode - real data
    console.log('Fetching trial from API...');
    this.apiService.getRandomTrials(1).subscribe({
      next: (data) => {
        console.log('API returned data:', data);
        
        if (data.length > 0) {
          // Check for duplicates
          const newTrial = data[0];
          const isDuplicate = this.trials.some(trial => trial.id === newTrial.id);
          
          if (!isDuplicate) {
            console.log('New unique trial found:', newTrial.id);
            // Add the new trial to the beginning of the array with animation flag
            const newTrials = [{ ...newTrial, isNew: true }, ...this.trials.map(t => ({ ...t, isNew: false }))];
            
            // If we have more than 10 trials, remove the oldest one
            this.trials = newTrials.length > 10 ? newTrials.slice(0, 10) : newTrials;
            
            // Remove the 'isNew' flag after animation completes
            setTimeout(() => {
              this.trials = this.trials.map(t => ({ ...t, isNew: false }));
            }, 3000);
          } else {
            console.log('Duplicate trial found, trying again');
            // Try again if duplicate
            this.fetchNewTrial();
          }
        } else {
          console.warn('API returned empty data');
        }
      },
      error: (err) => {
        console.error('Error fetching new trial:', err);
      }
    });
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