import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, PopoverController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { MoreComponent } from '../../other/more/more.component';
import { RestaurantService } from '../../services/restaurant.service';
import { InvitationsPage } from './invitations/invitations.page';

interface Worker {
  name: string;
  _id: string;
  date: string;
  avatar: string;
  username: string;
  role: string;
}

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss'],
})
export class StaffComponent implements OnInit {

  staff: Worker[] = [];

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private loader: LoadService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
  ) { };


  add() {
    this.router.go(["restaurant", this.service.restaurantId, "people", "worker", "invite"], { replaceUrl: true });
  }
  async invitations() {
    const modal = await this.modalCtrl.create({
      component: InvitationsPage,
      mode: "ios",
      cssClass: "modal-width",
      swipeToClose: true,
    });

    await modal.present();
  }
  full(id: string) {
    this.router.go(["restaurant", this.service.restaurantId, "people", "full", id], { replaceUrl: true });
  }
  async open(event: any, id: string) {
    const popover = await this.popoverCtrl.create({
      component: MoreComponent,
      mode: "ios",
      componentProps: {
          remove: false,
          more: true,
          edit: false 
      },
      event
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if(data) {
      if(data == 1) {
        this.full(id);
      }
    }
  }

  async ngOnInit() {
    await this.loader.start();
    const staff: any = await this.service.get("staff");

    for(let i of staff) {
      this.staff.push({
        ...i,
        avatar: getImage(i.avatar),
      });
    }

    this.loader.end();
  }

}
