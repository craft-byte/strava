import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-name',
  templateUrl: './name.page.html',
  styleUrls: ['./name.page.scss'],
})
export class NamePage implements OnInit {

  ui = {
    message: "Other users will see the name when you write a comment, or a feedback. If no name provided username will be shown",
    redMessage: "",
    buttonTitle: "",
    backButtonTitle: "",
    disableButton: false,
  };

  type: string;
  name: string;

  constructor(
    private router: RouterService,
    private service: UserService,
    private main: MainService,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private loader: LoadService,
  ) { };

  checkName() {
    if(!this.name) {
      this.ui.redMessage = "Enter your name please";
      return false;
    } else if(this.name.length < 6) {
      this.ui.redMessage = "Sorry, your name can't be less than 6 characters";
      return false;
    } else if(this.name.length > 30) {
      this.ui.redMessage = "Sorry, your name can't be more than 30 characters";
      return false;
    }
    this.ui.redMessage = "";
    return true;
  }

  async submit() {
    this.ui.disableButton = true;
    if(!this.checkName()) {
      this.ui.disableButton = false;
      return;
    }

    try {
      const result: any = await this.service.post({ name: this.name }, "name/set");
      this.skip();
      if(!result.success) {
        (await this.toastCtrl.create({
          duration: 3000,
          message: "Sorry, something went wrong updating your name. Please, try again later.",
          color: "red",
          mode: "ios"
        })).present();
      } else {
        this.main.userInfo.name = this.name;
      }
    } catch (e) {
      if(e == 422) {
        this.ui.redMessage = "Your name is not correct.";
      }
    }

  }
  
  skip() {
    if(this.type == "1") {
      this.router.go(["user/email"], { replaceUrl: true });
    } else {
      const last = this.route.snapshot.queryParamMap.get("last");
      if(last) {
        return this.router.go([last], { replaceUrl: true });
      }
      this.router.go(["user/info"], { replaceUrl: true });
    }
  }

  ngOnInit() {
    this.type = this.route.snapshot.paramMap.get('type');
    if(this.type == "1") {
      this.ui.buttonTitle = "Next";
      this.ui.backButtonTitle = "Skip";
    } else {
      this.ui.backButtonTitle = "Back";
      this.ui.buttonTitle = "Submit";
      this.name = this.main.userInfo.name;
    }
    this.loader.end();
  }

}
