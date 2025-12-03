import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { getRippleColorAuto } from '../../utils/ripple.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  constructor(private router: Router) {}

  onSubmit(): void {
    // TODO: Implémenter la logique de connexion
    console.log('Login attempt:', { email: this.email, password: this.password, rememberMe: this.rememberMe });
    // this.router.navigate(['/']);
  }
}

