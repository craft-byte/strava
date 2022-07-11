import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss'],
})
export class RestaurantComponent implements OnInit {

  more: any;

  ui = {
    expand: false,
  }

  constructor(
    private router: Router,
    private service: UserService,
  ) { };

  @Input() data: any;

  goRestaurant() {
    this.router.navigate(["restaurant", this.data._id], { replaceUrl: true });
  }

  async expand() {
    if(this.ui.expand) {
      return this.ui.expand = false;
    }
    
    // this.more = await this.service.get("restaurant/expanded", this.data._id);

    this.ui.expand = true;
  }

  ngOnInit() {}

}
