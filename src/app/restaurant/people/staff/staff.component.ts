import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { Restaurant } from 'src/models/general';
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

  invitingsWindow = false;

  constructor(
    private service: RadminService,
    private ppCtrl: PopoverController,
    private router: Router
  ) { };

  addUser() {
    this.router.navigate(["invite-user", this.restaurant._id], { queryParamsHandling: "preserve" });
  }

  openInvitings() {
    this.invitingsWindow = true;
  }

  onInvitingsWindowEmit(_data: { type: string, data?: any }) {
    this.invitingsWindow = false;
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
        this.router.navigate(["restaurant", this.restaurant._id, "people", "staff", "more", userId], { queryParamsHandling: "preserve" });
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
    this.restaurant = await this.service.getRestaurant();
    this.staff = await this.service.get("staff");
  }

}
