import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { countries } from 'src/assets/consts';
import { UserService } from '../../user.service';


@Component({
  selector: 'app-country',
  templateUrl: './country.page.html',
  styleUrls: ['./country.page.scss'],
})
export class CountryPage implements OnInit {

  countries = countries;

  country: string = "CA";
  name: string;

  ui = {
    message: "Choose you restaurant's country",
    nameMessage: "Your restaurant's name",
    redMessage: ""
  }

  constructor(
    private service: UserService,
    private load: LoadService,
    private router: RouterService,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
  ) { };


  exit() {
    this.router.go(["user/info"], { replaceUrl: true });
  }

  async next() {
    if(this.name.length < 4) {
      this.ui.redMessage = "Name has to be more than 4 characters";
      return;
    }

    await this.load.start();

    try {
      const result = await this.service.post<{ added: boolean; requirements: string[]; insertedId: string; }>({ country: this.country, name: this.name }, "add-restaurant/create")
      if(result.added) {
        this.router.go(["restaurant", result.insertedId, "conf", "name"], { replaceUrl: true });
      } else {
        (await this.toastCtrl.create({
          duration: 2500,
          color: "red",
          mode: "ios",
          message: "Something went wrong. Please try again."
        })).present();
      }
    } catch (e: any) {
      if(e.status == 403) {
        if(e.body.reason == "email") {
          (await this.toastCtrl.create({
            message: "Before this you have to connect your email.",
            color: "orange",
            duration: 2500,
            mode: "ios"
          })).present();
          this.router.go(["user/email"], { queryParams: { last: this.router.url } });
        }
      } else if(e.status == 400) {
        if(e.body.reason == "country") {
          (await this.toastCtrl.create({
            message: "Sorry. Your country is not supported yet.",
            mode: "ios",
            color: "red",
            duration: 5000,
          })).present();
        }
      } else if(e.status == 422) {
        (await this.toastCtrl.create({
          message: "Please, choose your country and try again.",
          color: "orange",
          mode: "ios",
          duration: 2000,
        })).present();
      }
    }
    this.load.end();
  }


  update() {
    this.router.go([], { queryParams: { c: this.country } }, false);
  }

  async ngOnInit() {
    await this.load.start();

    const { c } = this.route.snapshot.queryParams;

    const result: any = await this.service.get("add-restaurant/country");


    if(result && result.code) {
      this.country = c?.length == 2 ? c : null || result.code || "AF";
    }

    this.load.end();
  }

}
