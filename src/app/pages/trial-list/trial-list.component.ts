import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trial-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trial-list.component.html',
  styleUrl: './trial-list.component.scss'
})
export class TrialListComponent {} 