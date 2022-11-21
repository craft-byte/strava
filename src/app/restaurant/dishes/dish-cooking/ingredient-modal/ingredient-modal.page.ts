import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-ingredient-modal',
  templateUrl: './ingredient-modal.page.html',
  styleUrls: ['./ingredient-modal.page.scss'],
})
export class IngredientModalPage implements OnInit {

  amount: number;

  constructor(
    private modalCtrl: ModalController,
  ) { };

  @Input() data: any;


  change() {
    this.modalCtrl.dismiss({ type: 1, amount: this.amount });
  }
  remove() {
    this.modalCtrl.dismiss({ type: 2 });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  ngOnInit() {
    this.amount = this.data.amount;
  }

}
