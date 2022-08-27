import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {


  closeLink: string;
  ui = {
    title: "Wait...",
    showKitchen: false,
    showWaiter: false,
    showLocations: false
  }

  constructor(
    private service: StaffService,
    private router: RouterService,
    private loader: LoadService,
  ) { };

  go(l: "waiter" | "kitchen") {
    this.router.go(["staff", this.service.restaurantId, l]);
  }

  async ngOnInit() {
    await this.loader.start();
    const result = await this.service.get<{ restaurant: any; user: { role: string; showKitchen: boolean; showWaiter: boolean; } }>("dashboard");

    if(!result) {
      this.loader.end();
      return;
    }

    const { restaurant: { name, _id }, user: { showKitchen, showWaiter, role } } = result;

    this.ui.showKitchen = showKitchen;
    this.ui.showWaiter = showWaiter;
    this.ui.title = name;

    this.ui.showLocations = true;

    if(role == "admin" || role == "manager") {
      this.closeLink = `/restaurant/${_id}`;
    } else {
      this.closeLink = `/user/info`;
    }

    this.loader.end();
  }

}
