import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ContactComponent } from './pages/contact/contact.component';
import { TrainingsComponent } from './pages/trainings/trainings.component';
import { TrainingDetailComponent } from './pages/training-detail/training-detail.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'approche',
        loadComponent: () => import('./pages/approach/approach.component').then(m => m.ApproachComponent)
      },
      {
        path: 'alternance',
        loadComponent: () => import('./pages/apprenticeship/apprenticeship.component').then(m => m.ApprenticeshipComponent)
      },
      {
        path: 'projet-formation',
        loadComponent: () => import('./pages/training-project/training-project.component').then(m => m.TrainingProjectComponent)
      },
      {
        path: 'become-consultant',
        component: HomeComponent // TODO: Créer BecomeConsultantComponent
      },
      {
        path: 'contact-client',
        component: HomeComponent // TODO: Créer ContactClientComponent
      },
      {
        path: 'contact',
        component: ContactComponent
      },
      {
        path: 'cgu',
        loadComponent: () => import('./pages/legal/cgu.component').then(m => m.CguComponent)
      },
      {
        path: 'cgv',
        loadComponent: () => import('./pages/legal/cgv.component').then(m => m.CgvComponent)
      },
      {
        path: 'faq',
        loadComponent: () => import('./pages/legal/faq.component').then(m => m.FaqComponent)
      },
      {
        path: 'orientation',
        loadComponent: () => import('./pages/orientation-test/orientation-test.component').then(m => m.OrientationTestComponent)
      },
      {
        path: 'trainings',
        component: TrainingsComponent
      },
      {
        path: 'trainings/:slug/register',
        loadComponent: () => import('./pages/training-register/training-register.component').then(m => m.TrainingRegisterComponent)
      },
      {
        path: 'trainings/:slug',
        component: TrainingDetailComponent
      },
      {
        path: 'account/enrollments',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/account/user-enrollments/user-enrollments.component').then(m => m.UserEnrollmentsComponent)
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: 'register',
        component: RegisterComponent
      }
    ]
  },
  {
    path: 'bo',
    loadChildren: () => import('./backoffice/backoffice.routes').then(m => m.BACKOFFICE_ROUTES),
    canActivate: [adminGuard]
  }
];
