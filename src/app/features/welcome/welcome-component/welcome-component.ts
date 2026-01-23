import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from '../../../shared/services/api.service';
@Component({
  selector: 'app-welcome-component',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './welcome-component.html',
  styleUrl: './welcome-component.scss',
})
export class WelcomeComponent {
  clientes: any[] = [];
  constructor(private apiService: ApiService) {}
  ngOnInit(): void {
    this.apiService.get<any>('clientes').subscribe({
      next: (data) => {
        console.log('Clientes recibidos:', data);
        this.clientes = data;
        console.log('ehhhh!!!',this.clientes)
      },
      error: (err) => {
        console.error('Error al obtener clientes', err);
      },
    });
  }
}
