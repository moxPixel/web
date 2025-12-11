import {
  Component,
  Inject,
  OnInit
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  isDarkMode = false;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.checkDarkMode();
  }

  private checkDarkMode() {
    if (!this.document?.documentElement) return;
    this.isDarkMode = this.document.documentElement.classList.contains('dark');
  }
}

