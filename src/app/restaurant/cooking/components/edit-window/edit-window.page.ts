import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-window',
  templateUrl: './edit-window.page.html',
  styleUrls: ['./edit-window.page.scss'],
})
export class EditWindowPage implements OnInit {

  name: string;
  amount: number;
  price: number;

  constructor(
    private modalCtrl: ModalController
  ) { }

  @Input() component: any;


  close() {
    this.modalCtrl.dismiss();
  }

  submit() {
    console.log(this.name, this.amount, this.price);
    this.modalCtrl.dismiss({ name: this.name, amount: this.amount, price: this.price });
  }

  ngOnInit() {
    this.name = this.component.name;
    this.amount = this.component.amount;
    this.price = this.component.price;
  }

}
