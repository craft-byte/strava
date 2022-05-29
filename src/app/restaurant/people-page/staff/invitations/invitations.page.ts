import { Component, OnInit } from '@angular/core';
import { ModalController, PopoverController, ToastController } from '@ionic/angular';
import { MoreComponent } from 'src/app/restaurant/other/more/more.component';
import { RestaurantService } from 'src/app/restaurant/services/restaurant.service';

interface Invitation {
  date: string;
  _id: string;
  restaurantId: string;
  userId: string;
  restaurantName: string;
  role: string;
  user: {
    name: string;
    username: string;
  }
}

@Component({
  selector: 'app-invitations',
  templateUrl: './invitations.page.html',
  styleUrls: ['./invitations.page.scss'],
})
export class InvitationsPage implements OnInit {

  list: Invitation[];

  constructor(
    private service: RestaurantService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private toastCtrl: ToastController,
  ) { };

  close() {
    this.modalCtrl.dismiss();
  }

  async more(event: any, id: string) {
    const popover = await this.popoverCtrl.create({
      component: MoreComponent,
      mode: "ios",
      event,
      componentProps: {
        remove: true,
        edit: true,
        more: true,
      },
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if(data) {
      if(data == 3) {
        this.remove(id);
      }
    }
  }

  async remove(id: string) {
    for(let i in this.list) {
      if(this.list[i]._id == id) {
        const result: any = await this.service.delete("staff/invitations", id, this.list[i].userId);
    
        if(result.removed) {
          this.list.splice(+i, 1);
          if(this.list.length == 0) {
            this.modalCtrl.dismiss();
          }
          (await this.toastCtrl.create({
            duration: 4000,
            color: "green",
            mode: "ios",
            message: "Successfuly removed."
          })).present();
        } else {
          (await this.toastCtrl.create({
            duration: 4000,
            color: "red",
            mode: "ios",
            message: "Something went wrong. Try again later."
          })).present()
        }
      }
    }
  }

  user(id: string) {

  }



  async ngOnInit() {
    this.list = await this.service.get("staff/invitations/get");
  }

}
