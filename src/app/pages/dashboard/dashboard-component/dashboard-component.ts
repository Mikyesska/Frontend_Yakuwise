import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from "../../../core/layout/header/header-component/header-component";
import { SidebarComponent } from "../../../core/layout/sidebar/sidebar-component/sidebar-component";
import { FooterComponent } from "../../../core/layout/footer/footer-component/footer-component";
import { MainLayoutComponent } from "../../../core/layout/main-layout/main-layout-component/main-layout-component";

@Component({
  selector: 'app-dashboard-component',
  imports: [HeaderComponent, SidebarComponent, FooterComponent, MainLayoutComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
