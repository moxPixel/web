import { Routes } from '@angular/router';
import { BackofficeShellComponent } from './backoffice-shell/backoffice-shell.component';
import { TrainingListComponent } from './trainings/training-list/training-list.component';
import { TrainingFormComponent } from './trainings/training-form/training-form.component';
import { UserListComponent } from './users/user-list/user-list.component';
// Note: Certifications and Sessions routes are stubbed for now, structure ready for future pages.

export const BACKOFFICE_ROUTES: Routes = [
  {
    path: '',
    component: BackofficeShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      { path: 'users', component: UserListComponent },
      { path: 'users/new', loadComponent: () => import('./users/user-form/user-form.component').then(m => m.UserFormComponent) },
      { path: 'users/:id', loadComponent: () => import('./users/user-detail/user-detail.component').then(m => m.UserDetailComponent) },
      { path: 'trainings', component: TrainingListComponent },
      { path: 'trainings/new', component: TrainingFormComponent },
      { path: 'trainings/:id/edit', component: TrainingFormComponent },
      // Placeholders – to be implemented next:
      { path: 'certifications', loadComponent: () => import('./certifications/certification-list/certification-list.component').then(m => m.CertificationListComponent) },
      { path: 'certifications/new', loadComponent: () => import('./certifications/certification-form/certification-form.component').then(m => m.CertificationFormComponent) },
      { path: 'certifications/:id/edit', loadComponent: () => import('./certifications/certification-form/certification-form.component').then(m => m.CertificationFormComponent) },
      { path: 'sessions', loadComponent: () => import('./sessions/session-list/session-list.component').then(m => m.SessionListComponent) },
      { path: 'sessions/new', loadComponent: () => import('./sessions/session-form/session-form.component').then(m => m.SessionFormComponent) },
      { path: 'sessions/:id/edit', loadComponent: () => import('./sessions/session-form/session-form.component').then(m => m.SessionFormComponent) },
      { path: 'contacts', loadComponent: () => import('./contacts/contact-list/contact-list.component').then(m => m.ContactListComponent) },
      { path: 'enrollments', loadComponent: () => import('./enrollments/enrollment-list/enrollment-list.component').then(m => m.EnrollmentListComponent) },
      { path: 'enrollments/:id', loadComponent: () => import('./enrollments/enrollment-detail/enrollment-detail.component').then(m => m.EnrollmentDetailComponent) },
    ]
  }
];

