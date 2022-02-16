import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  constructor(
    private ppCtrl: PopoverController
  ) { }

  more() {
    this.ppCtrl.dismiss({}, "more");
  }

  ngOnInit() {}

}
