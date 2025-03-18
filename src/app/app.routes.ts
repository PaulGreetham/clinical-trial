import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TrialListComponent } from './pages/trial-list/trial-list.component';
import { TrialFavoritesComponent } from './pages/trial-favorites/trial-favorites.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'trials', component: TrialListComponent },
  { path: 'favorites', component: TrialFavoritesComponent },
  { path: '**', redirectTo: 'home' } // Handle any unknown routes
];
