import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {

  constructor(
    private popoverCtrl: PopoverController
  ) { };

  tutorials() {
    this.popoverCtrl.dismiss(null, '2')
  }
  user() {
    this.popoverCtrl.dismiss(null, "1");
  }

  ngOnInit() {}

}
