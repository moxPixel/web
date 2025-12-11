import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthApiService } from '../../../services/api/auth-api.service';
import { User, UserStatus, UserRole } from '../../../interfaces/auth.interface';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  private authService = inject(AuthApiService);
  private router = inject(Router);
  
  // Exposer UserStatus pour le template
  UserStatus = UserStatus;

  users = signal<User[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedStatus: UserStatus | 'all' = 'all';
  selectedRole: UserRole | 'all' = 'all';
  
  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  total = signal(0);
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Filtres
  statusFilters: Array<{ value: UserStatus | 'all'; label: string }> = [
    { value: 'all', label: 'Tous' },
    { value: UserStatus.PENDING, label: 'En attente' },
    { value: UserStatus.ACTIVE, label: 'Actifs' },
    { value: UserStatus.INACTIVE, label: 'Inactifs' },
    { value: UserStatus.SUSPENDED, label: 'Suspendus' },
  ];

  roleFilters: Array<{ value: UserRole | 'all'; label: string }> = [
    { value: 'all', label: 'Tous' },
    { value: UserRole.INDIVIDUAL, label: 'Particulier' },
    { value: UserRole.COMPANY, label: 'Entreprise' },
    { value: UserRole.TRAINER, label: 'Formateur' },
    { value: UserRole.CANDIDATE, label: 'Candidat' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    const query = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchTerm() || undefined,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      role: this.selectedRole !== 'all' ? this.selectedRole : undefined,
    };

    this.authService.getUsers(query).subscribe({
      next: (response) => {
        this.users.set(response.data || []);
        this.total.set(response.pagination?.total || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading.set(false);
        alert('Erreur lors du chargement des utilisateurs');
      },
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  setStatusFilter(status: UserStatus | 'all'): void {
    this.selectedStatus = status;
    this.currentPage.set(1);
    this.loadUsers();
  }

  setRoleFilter(role: UserRole | 'all'): void {
    this.selectedRole = role;
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus = 'all';
    this.selectedRole = 'all';
    this.currentPage.set(1);
    this.loadUsers();
  }

  create(): void {
    this.router.navigate(['/bo/users/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/bo/users', id]);
  }

  updateUserStatus(userId: string, status: UserStatus): void {
    if (!confirm(`Êtes-vous sûr de vouloir ${status === 'active' ? 'activer' : status === 'suspended' ? 'suspendre' : 'désactiver'} cet utilisateur ?`)) {
      return;
    }

    this.authService.updateUserStatus(userId, { status }).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        alert(error.message || 'Erreur lors de la mise à jour');
      },
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        alert(error.message || 'Erreur lors de la suppression');
      },
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  getStatusBadgeClass(status: UserStatus): string {
    switch (status) {
      case 'active':
        return 'badge badge-green';
      case 'pending':
        return 'badge badge-yellow';
      case 'inactive':
        return 'badge badge-gray';
      case 'suspended':
        return 'badge badge-red';
      default:
        return 'badge badge-gray';
    }
  }

  getStatusLabel(status: UserStatus): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En attente';
      case 'inactive':
        return 'Inactif';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  }

  /**
   * Obtenir le nom de l'entreprise depuis le profil
   */
  getCompanyName(user: User): string | null {
    if (user.profile && user.role === UserRole.COMPANY) {
      return (user.profile as any).companyName || null;
    }
    return null;
  }

  /**
   * Obtenir le label du rôle
   */
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
}

