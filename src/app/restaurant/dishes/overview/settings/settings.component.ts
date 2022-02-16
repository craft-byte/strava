import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  constructor(
    private ctrl: PopoverController
  ) { }

  go(w: "edit" | "remove" | "more") {
    this.ctrl.dismiss({}, w);
  }


  ngOnInit() {}

}
