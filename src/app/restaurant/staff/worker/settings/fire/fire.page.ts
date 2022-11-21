import { Component, Input, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-fire',
  templateUrl: './fire.page.html',
  styleUrls: ['./fire.page.scss'],
})
export class FirePage implements OnInit {

  ui = {
    username: null,
  };

  rating: number;
  comment: string;

  constructor(
    private modalCtrl: ModalController,
  ) { };

  @Input() username: string;

  cancel() {
    this.modalCtrl.dismiss();
  }

  submit() {
    this.modalCtrl.dismiss({ rating: this.rating, comment: this.comment, }, "submit");
  }

  onRatingChange(rating: number) {
    this.rating = rating;
  }


  ngOnInit() {

  }

}
