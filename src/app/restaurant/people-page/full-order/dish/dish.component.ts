import { Component, Input, OnInit } from '@angular/core';
import { getImage } from 'src/functions';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  takenByAvatar: string;
  cookAvatar: string;
  waiterAvatar: string;
  
  constructor() { };

  @Input() dish: any;

  ngOnInit() {
    if(this.dish.takenBy) {
      this.takenByAvatar = getImage(this.dish.takenBy.avatar);
    }
    if(this.dish.cook) {
      this.cookAvatar = getImage(this.dish.cook.avatar);
    }
    if(this.dish.waiter) {
      this.waiterAvatar = getImage(this.dish.waiter.avatar);
    }
  }

}
