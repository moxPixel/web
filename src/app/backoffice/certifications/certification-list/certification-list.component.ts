import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CertificationsService } from '../../core/services/certifications.service';
import { Certification, CertificationType } from '../../core/models/certification.model';

type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | CertificationType;

@Component({
  selector: 'app-certification-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatRippleModule, MatIconModule, MatButtonModule],
  templateUrl: './certification-list.component.html',
  styleUrls: ['./certification-list.component.css']
})
export class CertificationListComponent implements OnInit {
  private certificationsService = inject(CertificationsService);
  private router = inject(Router);

  certifications = signal<Certification[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedStatus: StatusFilter = 'all';
  selectedType: TypeFilter = 'all';

  // Structures de données pour les filtres
  statusFilters = [
    { value: 'all' as StatusFilter, label: 'Toutes' },
    { value: 'active' as StatusFilter, label: 'Actives' },
    { value: 'inactive' as StatusFilter, label: 'Inactives' },
  ];

  typeFilters = [
    { value: 'all' as TypeFilter, label: 'Tous' },
    { value: 'RNCP' as TypeFilter, label: 'RNCP' },
    { value: 'RS' as TypeFilter, label: 'RS' },
    { value: 'Other' as TypeFilter, label: 'Autres' },
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.certifications().filter(c => {
      const matchesSearch =
        !term ||
        c.title.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      if (this.selectedStatus !== 'all' && c.status !== this.selectedStatus) return false;
      if (this.selectedType !== 'all' && c.type !== this.selectedType) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadCertifications();
  }

  loadCertifications(): void {
    this.loading.set(true);
    this.certificationsService.getAll().subscribe({
      next: (data) => {
        this.certifications.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading certifications:', error);
        this.loading.set(false);
        alert('Erreur lors du chargement des certifications');
      },
    });
  }

  create(): void {
    this.router.navigate(['/bo/certifications/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/bo/certifications', id, 'edit']);
  }

  delete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette certification ?')) {
      this.loading.set(true);
      this.certificationsService.delete(id).subscribe({
        next: () => {
          this.loadCertifications();
        },
        error: (error) => {
          console.error('Error deleting certification:', error);
          this.loading.set(false);
          alert('Erreur lors de la suppression de la certification');
        },
      });
    }
  }

  setStatusFilter(value: StatusFilter): void {
    this.selectedStatus = value === this.selectedStatus ? 'all' : value;
  }

  setTypeFilter(value: TypeFilter): void {
    this.selectedType = value === this.selectedType ? 'all' : value;
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus = 'all';
    this.selectedType = 'all';
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'active':
        return 'badge badge-green';
      case 'inactive':
        return 'badge badge-gray';
      default:
        return 'badge badge-gray';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Inconnu';
    }
  }

  getTypeBadgeClass(type: CertificationType): string {
    switch (type) {
      case 'RNCP':
        return 'badge badge-cyan';
      case 'RS':
        return 'badge badge-yellow';
      default:
        return 'badge badge-gray';
    }
  }
}
