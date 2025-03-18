import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trial-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="trial-list-container">
      <h2>Clinical Trials List</h2>
      <p>Browse all available clinical trials</p>

      <!-- Placeholder for actual trial list -->
      <div class="trials-placeholder">
        <p>Trial list will be displayed here</p>
      </div>

      <div class="nav-links">
        <a routerLink="/home" class="nav-link">Back to Home</a>
        <a routerLink="/favorites" class="nav-link">View Favorites</a>
      </div>
    </div>
  `,
  styles: [`
    .trial-list-container {
      padding: 1rem;
    }
    
    .trials-placeholder {
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
export class TrialListComponent {} 