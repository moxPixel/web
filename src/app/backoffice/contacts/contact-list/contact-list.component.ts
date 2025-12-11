import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContactsApiService } from '../../../services/api/contacts-api.service';
import {
  Contact,
  ContactStatus,
  ContactType,
  RequestType,
  ContactQueryParams,
} from '../../../interfaces/contact.interface';
import { ContactResponseDialogComponent } from '../contact-response-dialog/contact-response-dialog.component';

type StatusFilter = 'all' | ContactStatus;
type ContactTypeFilter = 'all' | ContactType;
type RequestTypeFilter = 'all' | RequestType;

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatRippleModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css'],
})
export class ContactListComponent implements OnInit {
  private contactsService = inject(ContactsApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  contacts = signal<Contact[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedStatus: StatusFilter = 'all';
  selectedContactType: ContactTypeFilter = 'all';
  selectedRequestType: RequestTypeFilter = 'all';

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  total = signal(0);
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  // Structures de données pour les filtres
  statusFilters = [
    { value: 'all' as StatusFilter, label: 'Toutes' },
    { value: ContactStatus.PENDING, label: 'En attente' },
    { value: ContactStatus.IN_PROGRESS, label: 'En cours' },
    { value: ContactStatus.RESPONDED, label: 'Répondues' },
    { value: ContactStatus.ARCHIVED, label: 'Archivées' },
  ];

  contactTypeFilters = [
    { value: 'all' as ContactTypeFilter, label: 'Tous' },
    { value: ContactType.PARTICULIER, label: 'Particulier' },
    { value: ContactType.ENTREPRISE, label: 'Entreprise' },
    { value: ContactType.AUTRE, label: 'Autre' },
  ];

  requestTypeFilters = [
    { value: 'all' as RequestTypeFilter, label: 'Tous' },
    { value: RequestType.FORMATION, label: 'Formation' },
    { value: RequestType.DEVIS, label: 'Devis' },
    { value: RequestType.INFORMATION, label: 'Information' },
    { value: RequestType.AUTRE, label: 'Autre' },
  ];

  // Exposer les enums pour le template
  ContactStatus = ContactStatus;
  ContactType = ContactType;
  RequestType = RequestType;

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading.set(true);
    const query: ContactQueryParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchTerm() || undefined,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      contactType: this.selectedContactType !== 'all' ? this.selectedContactType : undefined,
      requestType: this.selectedRequestType !== 'all' ? this.selectedRequestType : undefined,
    };

    this.contactsService.list(query).subscribe({
      next: (response) => {
        this.contacts.set(response.data || []);
        this.total.set(response.pagination?.total || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.loading.set(false);
        alert('Erreur lors du chargement des demandes de contact');
      },
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadContacts();
  }

  setStatusFilter(value: StatusFilter): void {
    this.selectedStatus = this.selectedStatus === value ? 'all' : value;
    this.currentPage.set(1);
    this.loadContacts();
  }

  setContactTypeFilter(value: ContactTypeFilter): void {
    this.selectedContactType = this.selectedContactType === value ? 'all' : value;
    this.currentPage.set(1);
    this.loadContacts();
  }

  setRequestTypeFilter(value: RequestTypeFilter): void {
    this.selectedRequestType = this.selectedRequestType === value ? 'all' : value;
    this.currentPage.set(1);
    this.loadContacts();
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedContactType = 'all';
    this.selectedRequestType = 'all';
    this.currentPage.set(1);
    this.loadContacts();
  }

  openResponseDialog(contact: Contact): void {
    const dialogRef = this.dialog.open(ContactResponseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { contact },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadContacts();
      }
    });
  }

  deleteContact(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande de contact ?')) {
      this.loading.set(true);
      this.contactsService.delete(id).subscribe({
        next: () => {
          this.loadContacts();
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
          this.loading.set(false);
          alert('Erreur lors de la suppression de la demande de contact');
        },
      });
    }
  }

  getStatusBadgeClass(status: ContactStatus): string {
    switch (status) {
      case ContactStatus.PENDING:
        return 'badge badge-yellow';
      case ContactStatus.IN_PROGRESS:
        return 'badge badge-cyan';
      case ContactStatus.RESPONDED:
        return 'badge badge-green';
      case ContactStatus.ARCHIVED:
        return 'badge badge-gray';
      default:
        return 'badge badge-gray';
    }
  }

  getStatusLabel(status: ContactStatus): string {
    switch (status) {
      case ContactStatus.PENDING:
        return 'En attente';
      case ContactStatus.IN_PROGRESS:
        return 'En cours';
      case ContactStatus.RESPONDED:
        return 'Répondu';
      case ContactStatus.ARCHIVED:
        return 'Archivé';
      default:
        return status;
    }
  }

  getContactTypeLabel(type: ContactType): string {
    switch (type) {
      case ContactType.PARTICULIER:
        return 'Particulier';
      case ContactType.ENTREPRISE:
        return 'Entreprise';
      case ContactType.AUTRE:
        return 'Autre';
      default:
        return type;
    }
  }

  getRequestTypeLabel(type: RequestType): string {
    switch (type) {
      case RequestType.FORMATION:
        return 'Formation';
      case RequestType.DEVIS:
        return 'Devis';
      case RequestType.INFORMATION:
        return 'Information';
      case RequestType.AUTRE:
        return 'Autre';
      default:
        return type;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadContacts();
    }
  }
}

