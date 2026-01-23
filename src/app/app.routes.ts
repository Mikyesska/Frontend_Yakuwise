import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome-component/welcome-component';
import { LoginComponent } from './features/auth/pages/login/login-component/login-component';
import { DashboardComponent } from './pages/dashboard/dashboard-component/dashboard-component';
import { HomeComponent } from './pages/home/home-component/home-component';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path:'login',
    component:LoginComponent
  },
  {
    path: '',
    component: WelcomeComponent
  },
  {
    path:'dashboard',
    component:DashboardComponent
  },
  {
    path:'**',
    redirectTo:''
  }
];
