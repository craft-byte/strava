import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-name',
  templateUrl: './name.page.html',
  styleUrls: ['./name.page.scss'],
})
export class NamePage implements OnInit {

  firstName: string;
  lastName: string;

  restaurantId: string;

  ui = {
    redMessage: "",
    message: "Your full name"
  }

  constructor(
    private service: UserService,
    private router: RouterService,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private loader: LoadService,
  ) { };

  back() {
    this.router.go(["restaurant", this.restaurantId], { replaceUrl: true });
  }



  async submit() {
    if(!this.firstName || !this.lastName) {
      this.ui.redMessage = "Your name is not completed";
      return;
    }

  
    await this.loader.start();
  

    const result: any = await this.service.post({ firstName: this.firstName, lastName: this.lastName }, "add-restaurant/name", this.restaurantId);

    if(result.updated) {

      this.router.go(["add-restaurant", this.restaurantId, "dob"], {});
      
    } else {
      (await this.toastCtrl.create({
        duration: 3000,
        message: "Sorry, something went wrong. Please, try again.",
        color: "red",
        mode: "ios",
      })).present();
    }

  }

  async ngOnInit() {
    await this.loader.start();
    this.restaurantId = this.route.snapshot.paramMap.get('restaurantId');

    const result: any = await this.service.get("name");

    if(result) {
      this.firstName = result.firstName;
      this.lastName = result.lastName;
    }

    this.loader.end();
  }

}
