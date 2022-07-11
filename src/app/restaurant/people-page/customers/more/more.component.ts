import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  constructor(
    private popoverCtrl: PopoverController,
  ) { };

  @Input() isBlacklisted: boolean;

  go(s: string) {
    this.popoverCtrl.dismiss(s);
  }

  ngOnInit() {}

}
