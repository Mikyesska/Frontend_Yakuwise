import { Component } from '@angular/core';
import { HeaderComponent } from "../../../core/layout/header/header-component/header-component";
import { SidebarComponent } from "../../../core/layout/sidebar/sidebar-component/sidebar-component";
import { MainLayoutComponent } from "../../../core/layout/main-layout/main-layout-component/main-layout-component";
import { FooterComponent } from "../../../core/layout/footer/footer-component/footer-component";

@Component({
  selector: 'app-home-component',
  imports: [HeaderComponent, SidebarComponent, MainLayoutComponent, FooterComponent],
  templateUrl: './home-component.html',
  styleUrl: './home-component.scss',
})
export class HomeComponent {

}
