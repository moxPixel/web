import { Routes } from '@angular/router';

import { AboutPage } from './pages/about/about.page';
import { ContactPage } from './pages/contact/contact.page';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { TrainingDetailPage } from './pages/training-detail/training-detail.page';
import { TrainingsPage } from './pages/trainings/trainings.page';
import { OrientationTestPage } from './pages/orientation-test/orientation-test.page';
import { TrainingRegisterPage } from './pages/training-register/training-register.page';
import { CguPage } from './pages/legal/cgu.page';
import { CgvPage } from './pages/legal/cgv.page';
import { FaqPage } from './pages/legal/faq.page';
import { AlternancePage } from './pages/alternance/alternance.page';
import { ProjetFormationPage } from './pages/projet-formation/projet-formation.page';
import { ApprochePage } from './pages/approche/approche.page';
import { RecrutementPage } from './pages/recrutement/recrutement.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { ResetPasswordPage } from './pages/reset-password/reset-password.page';
import { ProfilePage } from './pages/profile/profile.page';
import { authGuard } from './shared/guards/auth.guard';
import { adminGuard } from './shared/guards/admin.guard';
import { BackofficePage } from './pages/backoffice/backoffice.page';
import { BackofficeTrainingsPage } from './pages/backoffice/backoffice-trainings.page';
import { BackofficeUsersPage } from './pages/backoffice/backoffice-users.page';
import { BackofficeContactsPage } from './pages/backoffice/backoffice-contacts.page';
import { BackofficeEnrollmentsPage } from './pages/backoffice/backoffice-enrollments.page';
import { BackofficeTrainingFormPage } from './pages/backoffice/backoffice-training-form.page';
import { BackofficeSessionsPage } from './pages/backoffice/backoffice-sessions.page';
import { BackofficeSessionFormPage } from './pages/backoffice/backoffice-session-form.page';
import { BackofficeCertificationsPage } from './pages/backoffice/backoffice-certifications.page';
import { BackofficeCertificationFormPage } from './pages/backoffice/backoffice-certification-form.page';
import { BackofficeEventsPage } from './pages/backoffice/backoffice-events.page';
import { BackofficeEventFormPage } from './pages/backoffice/backoffice-event-form.page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomePage,
    data: {
      seo: {
        title: 'École IA & Tech — Bootcamp, alternance, certifications',
        description:
          'Unlock forme aux métiers Tech & IA avec une approche terrain: projets réels, mentorat, alternance, et accompagnement carrière.',
        canonicalPath: '/',
        ogType: 'website',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Unlock Formation',
          url: 'https://www.unlock-formation.fr',
          logo: 'https://www.unlock-formation.fr/assets/images/logo/logo-dark.png',
        },
      },
    },
  },
  {
    path: 'about',
    component: AboutPage,
    data: {
      seo: {
        title: 'À propos',
        description: 'Découvrez Unlock: pédagogie, équipe, et méthode pour former aux compétences recherchées par les entreprises.',
        canonicalPath: '/about',
        ogType: 'website',
      },
    },
  },
  {
    path: 'alternance',
    component: AlternancePage,
    data: {
      seo: {
        title: 'Alternance',
        description: "Apprendre et travailler: contrats, financement, accompagnement et rythme — l'alternance chez Unlock.",
        canonicalPath: '/alternance',
        ogType: 'website',
      },
    },
  },
  {
    path: 'projet-formation',
    component: ProjetFormationPage,
    data: {
      seo: {
        title: 'Projet de formation',
        description: 'Construisez votre projet de formation: objectifs, niveau, rythme et prochaines étapes.',
        canonicalPath: '/projet-formation',
        ogType: 'website',
      },
    },
  },
  {
    path: 'approche',
    component: ApprochePage,
    data: {
      seo: {
        title: 'Approche pédagogique',
        description: 'Une pédagogie pratique, orientée production, avec évaluation continue et accompagnement.',
        canonicalPath: '/approche',
        ogType: 'website',
      },
    },
  },
  {
    path: 'recrutement',
    component: RecrutementPage,
    data: {
      seo: {
        title: 'Recrutement',
        description: 'Process de recrutement Unlock: étapes, critères, et préparation.',
        canonicalPath: '/recrutement',
        ogType: 'website',
      },
    },
  },
  {
    path: 'trainings',
    component: TrainingsPage,
    data: {
      seo: {
        title: 'Formations',
        description: 'Explorez nos formations (bootcamp, alternance, certifiantes) en développement, data/IA, cloud, cybersécurité.',
        canonicalPath: '/trainings',
        ogType: 'website',
      },
    },
  },
  {
    path: 'trainings/:slug/register',
    component: TrainingRegisterPage,
    data: {
      seo: {
        title: 'Inscription formation',
        description: "Demande d'inscription: session, financement et informations de contact.",
        robots: 'noindex,nofollow',
        ogType: 'website',
      },
    },
  },
  {
    path: 'trainings/:slug',
    component: TrainingDetailPage,
    // Dynamic SEO is set in the page once the training is loaded
    data: {
      seo: {
        robots: 'index,follow',
        ogType: 'article',
      },
    },
  },
  {
    path: 'orientation',
    component: OrientationTestPage,
    data: {
      seo: {
        title: 'Test d’orientation',
        description: 'Un test intelligent (EVA) pour vous orienter vers la formation la plus adaptée.',
        canonicalPath: '/orientation',
        ogType: 'website',
      },
    },
  },
  {
    path: 'contact',
    component: ContactPage,
    data: {
      seo: {
        title: 'Contact',
        description: 'Contactez Unlock: questions, inscriptions, alternance, financement.',
        canonicalPath: '/contact',
        ogType: 'website',
      },
    },
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [authGuard],
    data: { seo: { title: 'Profil', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice',
    component: BackofficePage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/trainings',
    component: BackofficeTrainingsPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Formations', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/trainings/new',
    component: BackofficeTrainingFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Nouvelle formation', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/trainings/:id/edit',
    component: BackofficeTrainingFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Éditer formation', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/sessions',
    component: BackofficeSessionsPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Sessions', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/sessions/new',
    component: BackofficeSessionFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Nouvelle session', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/sessions/:id/edit',
    component: BackofficeSessionFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Éditer session', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/events',
    component: BackofficeEventsPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Événements', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/events/new',
    component: BackofficeEventFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Nouvel événement', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/events/:id/edit',
    component: BackofficeEventFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Éditer événement', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/certifications',
    component: BackofficeCertificationsPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Certifications', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/certifications/new',
    component: BackofficeCertificationFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Nouvelle certification', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/certifications/:id/edit',
    component: BackofficeCertificationFormPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Éditer certification', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/users',
    component: BackofficeUsersPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Utilisateurs', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/contacts',
    component: BackofficeContactsPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Contacts', robots: 'noindex,nofollow' } },
  },
  {
    path: 'backoffice/enrollments',
    component: BackofficeEnrollmentsPage,
    canActivate: [adminGuard],
    data: { seo: { title: 'Backoffice — Inscriptions', robots: 'noindex,nofollow' } },
  },
  {
    path: 'cgu',
    component: CguPage,
    data: { seo: { title: 'CGU', canonicalPath: '/cgu', ogType: 'website' } },
  },
  {
    path: 'cgv',
    component: CgvPage,
    data: { seo: { title: 'CGV', canonicalPath: '/cgv', ogType: 'website' } },
  },
  {
    path: 'faq',
    component: FaqPage,
    data: { seo: { title: 'FAQ', canonicalPath: '/faq', ogType: 'website' } },
  },
  {
    path: 'login',
    component: LoginPage,
    data: { seo: { title: 'Connexion', robots: 'noindex,nofollow' } },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage,
    data: { seo: { title: 'Mot de passe oublié', robots: 'noindex,nofollow' } },
  },
  {
    path: 'reset-password',
    component: ResetPasswordPage,
    data: { seo: { title: 'Réinitialiser le mot de passe', robots: 'noindex,nofollow' } },
  }
];
