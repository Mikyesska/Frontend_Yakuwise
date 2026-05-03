import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SidebarService } from '../../../../shared/services/sidebar.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-sidebar-component',
  imports: [NgClass],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class SidebarComponent {

  // Inyectamos el servicio (usamos protected para que el HTML lo vea)
  protected sidebarService = inject(SidebarService);

}
