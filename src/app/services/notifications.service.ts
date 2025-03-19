import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { Trial } from '../types/trial.types';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  
  // Success notifications
  showAddedToFavorites(trial: Trial): void {
    Swal.fire({
      title: 'Added to Favorites!',
      text: `"${trial.name}" has been added to your favorites`,
      icon: 'success',
      confirmButtonText: 'Great!',
      confirmButtonColor: '#00a78e',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  showMultipleAddedToFavorites(count: number): void {
    Swal.fire({
      title: 'Added to Favorites!',
      text: `${count} trial${count > 1 ? 's' : ''} added to your favorites`,
      icon: 'success',
      confirmButtonText: 'Great!',
      confirmButtonColor: '#00a78e',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  showRemovedFromFavorites(trialName: string): void {
    Swal.fire({
      title: 'Removed from Favorites',
      text: `"${trialName}" has been removed from your favorites`,
      icon: 'success',
      confirmButtonText: 'Ok',
      confirmButtonColor: '#00a78e',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  showMultipleRemovedFromFavorites(count: number): void {
    Swal.fire({
      title: 'Removed from Favorites',
      text: `${count} trial${count > 1 ? 's' : ''} removed from your favorites`,
      icon: 'success',
      confirmButtonText: 'Ok',
      confirmButtonColor: '#00a78e',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  // Info notifications
  showAlreadyInFavorites(trial: Trial): void {
    Swal.fire({
      title: 'Already in Favorites',
      text: `"${trial.name}" is already in your favorites`,
      icon: 'info',
      confirmButtonText: 'Got it',
      confirmButtonColor: '#2c7fb8',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  showNoNewItemsAdded(): void {
    Swal.fire({
      title: 'No New Items',
      text: 'All selected trials are already in your favorites',
      icon: 'info',
      confirmButtonText: 'Got it',
      confirmButtonColor: '#2c7fb8',
      timer: 3000,
      timerProgressBar: true
    });
  }
  
  // Confirmation dialogs
  confirmRemoveFromFavorites(trial: Trial): Promise<any> {
    return Swal.fire({
      title: 'Remove from Favorites?',
      text: `Are you sure you want to remove "${trial.name}" from your favorites?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel'
    });
  }
  
  confirmRemoveMultipleFromFavorites(count: number): Promise<any> {
    return Swal.fire({
      title: 'Remove Selected?',
      text: `Are you sure you want to remove ${count} selected trial${count > 1 ? 's' : ''} from your favorites?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Yes, remove them',
      cancelButtonText: 'Cancel'
    });
  }
} 