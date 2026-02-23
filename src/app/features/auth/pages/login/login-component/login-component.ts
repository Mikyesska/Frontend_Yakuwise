import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-login-component',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {
  showPassword: boolean = false;

  tooglePasswordVisibility() {
    const inputPassword = document.getElementById('password') as HTMLInputElement;
    this.showPassword=!this.showPassword;

    if (this.showPassword) {
      inputPassword.setAttribute('type', 'text');
    } else {
      inputPassword.setAttribute('type', 'password');
    }
    
  }
}
