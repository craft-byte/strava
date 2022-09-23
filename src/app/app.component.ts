import { Component, HostListener } from '@angular/core';
import { UtilitiesService } from './other/utilities.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private utilities: UtilitiesService,
  ) {

  }

  @HostListener('document:click', ['$event'])
  documentClick(event: any): void {
    this.utilities.documentClickedTarget.next(event.target);
  }

}
