import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-fire-modal',
  templateUrl: './fire-modal.page.html',
  styleUrls: ['./fire-modal.page.scss'],
})
export class FireModalPage implements OnInit {

  rating: number = null;
  text: string;

  constructor(
    private modalCtrl: ModalController,
  ) { };

  @Input() name: string;

  close() {
    this.modalCtrl.dismiss();
  }

  onRatingChange(e: number) {
    this.rating = e;
  }
  submit() {
    this.modalCtrl.dismiss({
      rating: this.rating,
      text: this.text
    });
  }


  ngOnInit() {
  }

}
