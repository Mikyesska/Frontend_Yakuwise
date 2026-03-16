import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-sidebar-component',
  imports: [],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.scss',
})
export class SidebarComponent implements AfterViewInit  {
  @ViewChild('mySidebar') mySidebar: ElementRef = {} as ElementRef;
  sidebarOpen = false;
  
  ngAfterViewInit(): void {
    this.mySidebar.nativeElement.style.display = 'block';
  }

  close() {
    this.mySidebar.nativeElement.style.display = 'none';
    this.sidebarOpen = false;
  }

}
