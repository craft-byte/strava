import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { Restaurant, Worker } from 'src/models/radmin';
import { RadminService } from '../../radmin.service';
import { MoreComponent } from './more/more.component';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss'],
})
export class StaffComponent implements OnInit {

  restaurant: Restaurant;

  staff: Worker[] = [];

  windowType: string = null;

  constructor(
    private service: RadminService,
    private ppCtrl: PopoverController,
    private router: Router
  ) { };

  add() {
    this.windowType = "add";
  }

  onWindowEmited({ type, newWorker }: { type: string, newWorker?: any }) {
    this.windowType = null;
    if(type == "added") {
      this.staff.push(newWorker);
    }
  }

  async openPopover(btn: any, userId: string) {
    const popover = await this.ppCtrl.create({
      component: MoreComponent,
      event: btn,
      translucent: true,
      mode: "ios"
    });
    await popover.present();
  
    const { role } = await popover.onDidDismiss();

    switch (role) {
      case "more":
        this.router.navigate(["radmin", "people", "staff", "more", userId], { queryParamsHandling: "preserve" });
        break;
    
      default:
        break;
    }
  }

  onWorkerEmit({ type, data }: { type: "more"; data: any }) {
    if(type == "more") {
      this.openPopover(data.btn, data.user);
    }
  }

  async ngOnInit() {
    this.restaurant = await this.service.getRestaurant("staff");
    this.staff = this.restaurant.staff;
  }

}
