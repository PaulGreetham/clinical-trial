import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-container">
      <h2>Welcome to Clinical Trials Application</h2>
      <p>Your centralized platform for managing clinical trials</p>
      
      <div class="nav-links">
        <a routerLink="/trials" class="nav-button">View Trials</a>
        <a routerLink="/favorites" class="nav-button">View Favorites</a>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      text-align: center;
      padding: 2rem;
    }
    
    .nav-links {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .nav-button {
      background-color: #3f51b5;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      transition: background-color 0.3s;
    }
    
    .nav-button:hover {
      background-color: #303f9f;
    }
  `]
})
export class HomeComponent {} 