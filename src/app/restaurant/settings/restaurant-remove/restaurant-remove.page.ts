import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-restaurant-remove',
  templateUrl: './restaurant-remove.page.html',
  styleUrls: ['./restaurant-remove.page.scss'],
})
export class RestaurantRemovePage implements OnInit {

  result: string;

  constructor(
    private modalCtrl: ModalController,
  ) { };

  @Input() name: string;

  submit() {
    console.log(this.result, this.name);
    if(this.name == this.result) {
      this.modalCtrl.dismiss(true);
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  ngOnInit() {
  }

}
