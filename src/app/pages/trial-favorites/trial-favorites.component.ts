import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { NotificationsService } from '../../services/notifications.service';
import { Trial } from '../../models/trial.model';

@Component({
  selector: 'app-trial-favorites',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './trial-favorites.component.html',
  styleUrl: './trial-favorites.component.scss'
})
export class TrialFavoritesComponent implements OnInit {
  favorites: Trial[] = [];
  selectedTrials: Set<string> = new Set();
  
  private apiService = inject(ApiService);
  private notificationsService = inject(NotificationsService);
  
  ngOnInit(): void {
    // Subscribe to favorites observable to get updates
    this.apiService.favorites$.subscribe(favorites => {
      this.favorites = favorites;
    });
  }
  
  // Toggle selection of a trial for multi-remove functionality
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
  
  // Remove a single trial from favorites with confirmation
  removeFromFavorites(trialId: string): void {
    const trial = this.favorites.find(t => t.id === trialId);
    if (!trial) return;
    
    this.notificationsService.confirmRemoveFromFavorites(trial).then((result) => {
      if (result.isConfirmed) {
        this.apiService.removeFromFavorites(trialId);
      }
    });
  }
  
  // Remove selected trials from favorites with confirmation
  removeSelectedFromFavorites(): void {
    const trialIds = Array.from(this.selectedTrials);
    if (trialIds.length === 0) return;
    
    this.notificationsService.confirmRemoveMultipleFromFavorites(trialIds.length).then((result) => {
      if (result.isConfirmed) {
        this.apiService.removeMultipleFromFavorites(trialIds);
        this.selectedTrials.clear(); // Clear selection after removing
      }
    });
  }
} 