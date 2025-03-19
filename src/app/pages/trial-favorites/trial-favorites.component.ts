import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { NotificationsService } from '../../services/notifications.service';
import { Trial } from '../../types/trial.types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trial-favorites',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './trial-favorites.component.html',
  styleUrl: './trial-favorites.component.scss'
})
export class TrialFavoritesComponent implements OnInit, OnDestroy {
  favorites: Trial[] = [];
  selectedTrials: Set<string> = new Set();
  
  private apiService = inject(ApiService);
  private notificationsService = inject(NotificationsService);
  private subscription = new Subscription();
  
  ngOnInit(): void {
    this.subscription.add(
      this.apiService.favorites$.subscribe(favorites => {
        this.favorites = favorites;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
  
  removeFromFavorites(trialId: string): void {
    const trial = this.favorites.find(t => t.id === trialId);
    if (!trial) return;
    
    this.notificationsService.confirmRemoveFromFavorites(trial).then((result) => {
      if (result.isConfirmed) {
        this.apiService.removeFromFavorites(trialId).subscribe();
      }
    });
  }
  
  removeSelectedFromFavorites(): void {
    const trialIds = Array.from(this.selectedTrials);
    if (trialIds.length === 0) return;
    
    this.notificationsService.confirmRemoveMultipleFromFavorites(trialIds.length).then((result) => {
      if (result.isConfirmed) {
        this.apiService.removeMultipleFromFavorites(trialIds).subscribe();
        this.selectedTrials.clear();
      }
    });
  }
} 