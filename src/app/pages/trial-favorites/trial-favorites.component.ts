import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trial-favorites',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="favorites-container">
      <h2>Favorite Clinical Trials</h2>
      <p>View your saved clinical trials</p>

      <!-- Placeholder for favorites list -->
      <div class="favorites-placeholder">
        <p>Your favorite trials will appear here</p>
      </div>

      <div class="nav-links">
        <a routerLink="/home" class="nav-link">Back to Home</a>
        <a routerLink="/trials" class="nav-link">View All Trials</a>
      </div>
    </div>
  `,
  styles: [`
    .favorites-container {
      padding: 1rem;
    }
    
    .favorites-placeholder {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 2rem;
      margin: 1rem 0;
      text-align: center;
    }
    
    .nav-links {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .nav-link {
      color: #3f51b5;
      text-decoration: none;
    }
    
    .nav-link:hover {
      text-decoration: underline;
    }
  `]
})
export class TrialFavoritesComponent {} 