import { UpperCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-welcome-component',
  imports: [UpperCasePipe],
  templateUrl: './welcome-component.html',
  styleUrl: './welcome-component.scss',
})
export class WelcomeComponent  implements OnInit{
  welcome:string = "";
  genero:boolean = false;
  
  ngOnInit(): void {
    if (this.genero) {
      this.welcome = "bienvenido a"
    } else {
      this.welcome = "bienvenida a"
    }
  }
}
