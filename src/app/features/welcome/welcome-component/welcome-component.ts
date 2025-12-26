import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-welcome-component',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './welcome-component.html',
  styleUrl: './welcome-component.scss',
})
export class WelcomeComponent {

}
