import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { ContactComponent } from './pages/contact/contact.component';

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
        component: HomeComponent // TODO: Créer AboutComponent
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
        path: 'login',
        component: LoginComponent
      }
    ]
  }
];
