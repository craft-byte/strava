import { ThisReceiver } from '@angular/compiler';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { countries } from 'src/assets/consts';
import { UserService } from '../../user.service';


@Component({
  selector: 'app-bank-account',
  templateUrl: './bank-account.page.html',
  styleUrls: ['./bank-account.page.scss'],
})
export class BankAccountPage implements OnInit {

  currencies: string[] = [];
  countries = countries;
  country: string;

  currency: string;
  restaurantId: string;

  routing: number;
  number: string;
  name: string;


  ui = {
    show: false,
    numberRed: false,
    routingRed: false,
    errorMessage: "",
  }

  form: FormGroup;

  constructor(
    private router: RouterService,
    private route: ActivatedRoute,
    private service: UserService,
    private loader: LoadService,
    private toastCtrl: ToastController,
  ) { };



  curr(c: string) {
    this.currency = c;
  }

  back() {
    this.router.go(["restaurant", this.restaurantId, "settings"]);
  }

  

  async countryChange(e: any) {
    const { target: { value } } = e;

    try {
      const result: string[] = await this.service.get("add-restaurant/currencies", value);

      if (result) {
        this.currencies = [];
        for (let i of result) {
          this.currencies.push(i.toUpperCase());
        }
      }
    } catch (e: any) {
      if (e.status == 400) {
        this.form.patchValue({ country: this.country });
        (await this.toastCtrl.create({
          duration: 2000,
          message: "Sorry, this country is not supported yet.",
          color: "red",
          mode: "ios",
        })).present();
      }
    }
  }

  async next() {
    if(!this.form.valid || !this.currency) {
      return;
    }

    await this.loader.start();

    try {
      const result: any = await this.service.post({
        ...this.form.value,
        currency: this.currency,
      }, "add-restaurant/set/bank-account", this.restaurantId);
  
      if(result.updated) {
        (await this.toastCtrl.create({
          duration: 2000,
          color: "green",
          mode: "ios",
          message: "Your restaurant is successfuly created",
        })).present();
        this.router.go(["restaurant", this.restaurantId]);
      } else {
        (await this.toastCtrl.create({
          duration: 2000,
          color: "red",
          mode: "ios",
          message: "Something went wrong. Please try again.",
        })).present();
      }
    } catch (e) {
      if(e.status == 422) {
        (await this.toastCtrl.create({
          duration: 2000,
          color: "red",
          message: "Filled data is incorrect",
          mode: "ios"
        })).present();
      } else if(e.status == 400) {
        (await this.toastCtrl.create({
            duration: 2000,
            color: "red",
            message: "Something went wrong. Please try again",
            mode: "ios"
        })).present();
      }
    }

    this.loader.end();
  }

  async ngOnInit() {
    await this.loader.start();
    this.restaurantId = this.route.snapshot.paramMap.get("restaurantId");

    const result: { currencies: string[]; country: string; name: string; } = await this.service.get("add-restaurant/bank-account");

    if (result) {
      this.country = result.country;
      this.name = result.name;
      for (let i of result.currencies) {
        this.currencies.push(i.toUpperCase());
      }
      this.form = new FormGroup({
        number: new FormControl(null, [Validators.required]),
        branch: new FormControl(null, Validators.required),
        institution: new FormControl(null, Validators.required),
        name: new FormControl(result.name, Validators.required),
        country: new FormControl(result.country, Validators.required),
      });
    }

    this.ui.show = true;

    this.loader.end();
  }

}
