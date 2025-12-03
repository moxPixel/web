import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

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
        component: HomeComponent // TODO: Créer ContactComponent
      },
      {
        path: 'login',
        component: HomeComponent // TODO: Créer LoginComponent
      }
    ]
  }
];
