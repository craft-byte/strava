import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-name-modal',
  templateUrl: './name-modal.page.html',
  styleUrls: ['./name-modal.page.scss'],
})
export class NameModalPage implements OnInit {

  constructor(
    private modalCtrl: ModalController
  ) { };

  @Input() name: string;

  cancel() {
    this.modalCtrl.dismiss();
  }

  submit() {
    this.modalCtrl.dismiss({ name: this.name });
  }

  ngOnInit() {
    console.log(this.name);
  }

}
