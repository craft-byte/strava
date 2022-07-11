import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
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
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: UserService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { };


  async submit() {
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
      this.router.navigate(["user/info"], { replaceUrl: true });
    } else {
      const last = this.route.snapshot.queryParamMap.get("last");
      if (last) {
        return this.router.navigate([last], { replaceUrl: true });
      }
      this.router.navigate(["user/info"], { replaceUrl: true });
    }
  }

  async ngOnInit() {
    this.type = this.route.snapshot.paramMap.get('type');
    const { avatar } = await this.service.get("avatar");
    if(avatar) {
      this.ui.backTitle = ""
      this.avatar = getImage(avatar) || "./../../../../assets/images/no-image.jpg";
    }
  }

}
