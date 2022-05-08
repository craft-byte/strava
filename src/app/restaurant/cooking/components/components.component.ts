import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Component as C } from 'src/models/components';
import { RadminService } from '../../radmin.service';
import { AddWindowPage } from './add-window/add-window.page';

@Component({
  selector: 'app-components',
  templateUrl: './components.component.html',
  styleUrls: ['./components.component.scss'],
})
export class ComponentsComponent implements OnInit {

  components: any[] = [];
  searchText: string = null;

  ui = {
    noComponents: false,
  }

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private service: RadminService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    
  };

  async add() {
    const modal = await this.modalCtrl.create({
      component: AddWindowPage,
      mode: "ios",
      cssClass: "department-modal",
      swipeToClose: true,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if(data) {
      const result = await this.service.post(data, "components");

      this.ui.noComponents = false;
      this.components.push(result);
    }
  }
  async onEmited({ role, data }: { role: string; data: C }) {
    if(role == "edit") {
      
    } else if(role == "remove") {
      const alert = await this.alertCtrl.create({
        header: "Are you sure?",
        mode: "ios",
        buttons: [
          {
            text: "Cancel",
            role: "none"
          },
          {
            text: "Submit",
            role: "remove"
          }
        ]
      });

      await alert.present();

      const { role } = await alert.onDidDismiss();

      if(role == "remove") {
        const result = await this.service.delete("components", data._id);

        if((result as any).modifiedCount > 0) {
          for(let i in this.components) {
            if(this.components[i]._id == data._id) {
              this.components.splice(+i, 1);
              break;
            }
          }
        } else {
          const toast = await this.toastCtrl.create({
            message: "Something went wrong. Try again later.",
            color: "red",
            duration: 4000,
            mode: "ios"
          });

          toast.present();
        }
      }
    } else if(role == "more") {
      this.router.navigate(["restaurant", this.service.restaurantId, "cooking", "components", "more", data._id], { queryParamsHandling: "preserve" });
    }
  }

  async ngOnInit() {
    this.components = await this.service.get("components/all");

    if(this.components.length == 0) {
      this.ui.noComponents = true;
    }
  }

}
