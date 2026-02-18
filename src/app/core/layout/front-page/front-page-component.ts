import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-front-page-component',
  imports: [],
  templateUrl: './front-page-component.html',
  styleUrl: './front-page-component.scss',
})
export class FrontPageComponent implements AfterViewInit {
  @ViewChild('videoFondo') video!: ElementRef<HTMLVideoElement>;

  private readonly audio = new Audio('assets/sounds/audio-naturaleza.opus');

  reproduciendo: boolean = false;

  constructor() {
    this.audio.loop = true;
  }

  ngAfterViewInit() {
    this.video.nativeElement.muted = true;
    this.video.nativeElement.play().catch(err => {
      console.log("El autoplay fue bloqueado, esperando interacción.");
    });
  }

  toggleAudio() {
    if (this.reproduciendo) {
      this.audio.muted = true;
    } else {
      this.audio.muted = false;
      this.audio.play().catch(err => console.error("Error al reproducir:", err));
    }
    this.reproduciendo = !this.reproduciendo;
  }
}
