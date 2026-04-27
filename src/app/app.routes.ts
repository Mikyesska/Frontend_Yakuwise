import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login-component/login-component';
import { DashboardComponent } from './pages/dashboard/dashboard-component/dashboard-component';
import { HomeComponent } from './pages/home/home-component/home-component';
import { FrontPageComponent } from './core/layout/front-page/front-page-component';
import { WelcomeComponent } from './pages/welcome/welcome-component/welcome-component';

export const routes: Routes = [
  {
    path: 'frontpage',
    component: FrontPageComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    children:[
      {
        path:'welcome',
        component:WelcomeComponent
      }
    ]
  },
  {
    path:'login',
    component:LoginComponent
  },
  {
    path:'dashboard',
    component:DashboardComponent
  },
  {
    path:'**',
    redirectTo:'frontpage'
  }
];
