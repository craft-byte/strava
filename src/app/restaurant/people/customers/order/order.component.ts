import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getImage } from 'src/functions';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
})
export class OrderComponent implements OnInit {

  avatar: string;

  constructor(
    private router: Router
  ) { }

  @Input() data: any;
  @Input() restaurantId: string;

  goDish(id: string) {
    this.router.navigate(["restaurant", this.restaurantId, "dishes", "full", id], { replaceUrl: true, queryParamsHandling: "preserve" });
  }

  async ngOnInit() {
    this.avatar = await getImage(this.data.user.avatar, 0.4) || "./../../../../../assets/images/plain-avatar.jpg";
  }

}
