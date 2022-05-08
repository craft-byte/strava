import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-update-window',
  templateUrl: './update-window.page.html',
  styleUrls: ['./update-window.page.scss'],
})
export class UpdateWindowPage implements OnInit {

  
  amount: number;
  newWarning: number;

  constructor(
    private modalCtrl: ModalController
  ) { };


  
  @Input() name: string;
  @Input() warning: number;
  
  close() {
    this.modalCtrl.dismiss();
  }

  update() {
    this.modalCtrl.dismiss({ amount: this.amount, warning: this.newWarning });
  }

  ngOnInit() {
    this.newWarning = this.warning;
  }

}
