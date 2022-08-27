import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss'],
})
export class RestaurantComponent implements OnInit {

  more: any;


  constructor(
    private router: RouterService,
    private service: UserService,
  ) { };

  @Input() data: any;

  goRestaurant() {
    console.log(this.data);
    if(this.data.url) {
      this.router.go([this.data.url]);
    } else {
      this.router.go(["restaurant", this.data._id]);
    }
  }


  ngOnInit() {}

}
