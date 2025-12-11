import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthApiService } from '../../../services/api/auth-api.service';
import { RegisterDto, UserRole, UserStatus } from '../../../interfaces/auth.interface';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router); // Public pour le template
  private authService = inject(AuthApiService);

  // Données du formulaire
  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  role: UserRole = UserRole.ADMIN;
  status: UserStatus = UserStatus.ACTIVE;

  loading = signal(false);
  error = signal<string | null>(null);

  // Exposer les enums pour le template
  UserRole = UserRole;
  UserStatus = UserStatus;

  // Rôles disponibles pour création admin
  availableRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.INDIVIDUAL,
    UserRole.COMPANY,
    UserRole.TRAINER,
    UserRole.CANDIDATE,
  ];

  ngOnInit(): void {
    // Pas besoin de charger des données pour la création
  }

  onSubmit(): void {
    if (this.loading()) return;

    // Validation
    if (!this.email || !this.password) {
      this.error.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.password.length < 8) {
      this.error.set('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    // Utiliser la route admin pour créer directement l'utilisateur avec le statut souhaité
    this.authService.createUser({
      email: this.email,
      password: this.password,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined,
      role: this.role,
      status: this.status,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/bo/users']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Erreur lors de la création de l\'utilisateur');
      },
    });
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.USER]: 'Utilisateur',
      [UserRole.ADMIN]: 'Administrateur',
      [UserRole.INDIVIDUAL]: 'Particulier',
      [UserRole.COMPANY]: 'Entreprise',
      [UserRole.TRAINER]: 'Formateur',
      [UserRole.CANDIDATE]: 'Candidat',
    };
    return labels[role] || role;
  }

  getStatusLabel(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Actif';
      case UserStatus.PENDING:
        return 'En attente';
      case UserStatus.INACTIVE:
        return 'Inactif';
      case UserStatus.SUSPENDED:
        return 'Suspendu';
      default:
        return status;
    }
  }
}

