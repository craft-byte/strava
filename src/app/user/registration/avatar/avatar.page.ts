import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { UserService } from '../../user.service';
import { CropperPage } from './cropper/cropper.page';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.page.html',
  styleUrls: ['./avatar.page.scss'],
})
export class AvatarPage implements OnInit {

  type: string;
  avatar: string = "./../../../../assets/images/no-image.jpg";

  ui = {
    backTitle: "",
    imageClass: "",
    disableButton: false,
  }

  constructor(
    private router: RouterService,
    private route: ActivatedRoute,
    private service: UserService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loader: LoadService,
  ) { };


  async submit() {
    this.loader.start();
    this.ui.disableButton = true;
    const result: any = await this.service.post({ avatar: this.avatar }, "avatar");

    if (result.updated) {
      this.skip();
    } else {
      (await this.toastCtrl.create({
        duration: 3000,
        mode: "ios",
        color: "red",
        message: "Sorry, something went wrong updating your image. Please, try again later."
      })).present();
    }

    this.loader.end();
  }

  async setAvatar(event: any) {
    const modal = await this.modalCtrl.create({
      mode: "ios",
      cssClass: "modal-width",
      component: CropperPage,
      componentProps: {
        event,
      }
    });

    await modal.present();


    const { data, role } = await modal.onDidDismiss();

    if (role && role == "error") {
      return (await this.toastCtrl.create({
        duration: 3000,
        mode: "ios",
        color: "red",
        message: "Your image extension is not supported"
      })).present();
    }
    if (data) {
      this.avatar = data;
      this.ui.imageClass = "no-brightness"
    }
  }

  skip() {
    if (this.type == "1") {
      this.router.go(["user/info"], { replaceUrl: true });
    } else {
      const last = this.route.snapshot.queryParamMap.get("last");
      if (last) {
        return this.router.go([last], { replaceUrl: true });
      }
      this.router.go(["user/info"], { replaceUrl: true });
    }
  }

  async ngOnInit() {
    this.type = this.route.snapshot.paramMap.get('type');
    const result: { avatar: any } = await this.service.get("avatar");
    if(result.avatar) {
      this.ui.backTitle = ""
      this.avatar = getImage(result.avatar) || "./../../../../assets/images/no-image.jpg";
    }
    this.loader.end();
  }

}
