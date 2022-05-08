import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonRouterOutlet, ModalController } from '@ionic/angular';
import { getImage } from 'src/functions';
import { Worker } from 'src/models/components';
import { Restaurant } from 'src/models/general';
import { User } from 'src/models/user';
import { RadminService } from '../../radmin.service';
import { SettingsModalPage } from '../settings-modal/settings-modal.page';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss'],
})
export class MoreComponent implements OnInit {

  user: User;
  worker: Worker;
  name: string;
  role: string;
  joined: string;
  image: string;

  restaurant: Restaurant;
  

  ui = {
    showCapabilities: false
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RadminService,
    private modalCtrl: ModalController,
  ) { };

  back() {
    this.router.navigate(["restaurant", this.restaurant._id, "people", "staff"], { queryParamsHandling: "preserve" });
  }

  async goSettings() {
    const modal = await this.modalCtrl.create({
      mode: "ios",
      cssClass: "worker-settings",
      swipeToClose: true,
      component: SettingsModalPage,
      id: "settings",
      componentProps: {
        name: this.name,
        _id: this.user._id
      },
    });

    modal.present();
  }



  getDate(date: Date) {
    const d = new Date(date);
    const month = monthNames[d.getMonth()];

    this.joined = `${d.getDate()} ${month}`;
  }

  async capabilities() {
    const modal = await this.modalCtrl.create({
      component: ""
    });
  }

  async ngOnInit() {
    const user = this.route.snapshot.paramMap.get("id");
    this.restaurant = await this.service.getRestaurant();
    const { worker, user: u } = await this.service.get("staff", user);
    if(!worker) {
      return this.router.navigate(["restaurant", this.restaurant._id, "people", "staff"], { replaceUrl: true, queryParamsHandling: "preserve" });
    }
    this.user = u;
    this.worker = worker;
    this.name = this.user.name || this.user.username;
    this.image = await getImage(this.user.avatar) || "./../../../../assets/images/plain-avatar.jpg";
    this.getDate(this.worker.joined);


    switch (this.worker.role) {
      case "admin":
        this.role = "Admin";
        break;
      case "cook":
        this.role = "Cook";
        break;
      case "waiter":
        this.role = "Waiter";
        break;
      case "manager":
        this.role = "Manager";
        this.ui.showCapabilities = true;
        break;
    }

  }

}
