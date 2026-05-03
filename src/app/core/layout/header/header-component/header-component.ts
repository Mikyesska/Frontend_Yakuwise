import { Component, inject } from '@angular/core';
import { SidebarService } from '../../../../shared/services/sidebar.service';

@Component({
  selector: 'app-header-component',
  imports: [],
  templateUrl: './header-component.html',
  styleUrl: './header-component.scss',
})
export class HeaderComponent {
  protected sidebar = inject(SidebarService);
}
