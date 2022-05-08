import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { RadminService } from '../../radmin.service';

@Component({
  selector: 'app-fire',
  templateUrl: './fire.page.html',
  styleUrls: ['./fire.page.scss'],
})
export class FirePage implements OnInit {

  rating: number = 3;
  text: string = "";

  constructor(
    private service: RadminService,
    private modalCtrl: ModalController,
    private router: Router
  ) { };


  @Input() name: string;
  @Input() _id: string;

  close() {
    this.modalCtrl.dismiss();
  }

  submit() {
    this.service.post({text: this.text, stars: this.rating}, "staff", this.service.restaurantId, this._id, "fire");
    this.modalCtrl.dismiss(true);
    this.router.navigate(["restaurant", this.service.restaurantId, "people", "staff"], { queryParamsHandling: "preserve", replaceUrl: true });
  }

  onRatingChange(rating: number) {
    this.rating = rating;
  }

  ngOnInit() {
  }

}
