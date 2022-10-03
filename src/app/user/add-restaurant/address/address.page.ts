import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';


interface Result {
  continue: {
      line1: string;
      line2: string;
      city: string;
      postal_code: string;
      state: string;
  };
  states: any[];
  cities: any[];
  country: string;
}



@Component({
  selector: 'app-address',
  templateUrl: './address.page.html',
  styleUrls: ['./address.page.scss'],
})
export class AddressPage implements OnInit {

  restaurantId: string;

  show: any;

  data: Result["continue"];

  states: { id: number; name: string; iso2: string; }[];
  cities: { id: number; name: string; }[];

  country: string;


  form: FormGroup;

  ui = {
    postal: false,
    line1: false,
    line2: false,
    errorMessage: "",
  }


  constructor(
    private router: RouterService,
    private loader: LoadService,
    private route: ActivatedRoute,
    private service: UserService,
    private toastCtrl: ToastController,
  ) { };

  async stateUpdate(e: any) {
    await this.loader.start();

    this.cities = [];
    this.data.city = null;

    const { target: { value } } = e;


    const result: any = await this.service.post({ state: value, country: this.country, }, "add-restaurant/set/state", this.restaurantId);

    if(result) {
      this.data.state = value;
      this.data.city = result[0].name;
      this.cities = result;
      this.form.patchValue({ city: result[0].name });
    }
    

    this.loader.end();
  }
  async cityUpdate(e: any) {
    await this.loader.start();
    const { target: { value } } = e;
    
    this.data.city = value;

    const result: any = await this.service.post({ city: value, country: this.country, }, "add-restaurant/set/city", this.restaurantId);


    if(!result.updated) {
      (await this.toastCtrl.create({
        mode: "ios",
        message: "Something went wrong. Please try again.",
        color: "red",
        duration: 2000
      })).present();
    }

    this.loader.end();
  }


  back() {
    this.router.go(["restaurant", this.restaurantId], {});
  }

  async next() {
    if(!this.form.valid) {
      return;
    }

    await this.loader.start();

    try {
      const result: any = await this.service.post({...this.form.value, country: this.country}, "add-restaurant/set/all", this.restaurantId);

      if(result.updated) {
        this.router.go(["add-restaurant", this.restaurantId, "bank-account"]);
      } else {
        (await this.toastCtrl.create({
          color: "red",
          mode: "ios",
          message: "Something went wrong. Please try again",
          duration: 1500,
        })).present();
      }
    } catch (e) {
      if(e.status == 400) {
        if(e.body.reason == "postal_code") {
          this.ui.errorMessage = "Invalid postal code";
        }
      }
      throw e;
    }

    this.loader.end();
  }


  async ngOnInit() {
    await this.loader.start();
    this.restaurantId = this.route.snapshot.paramMap.get("restaurantId");


    try {

      const result = await this.service.get<Result>("add-restaurant/address", this.restaurantId);

      this.data = result.continue;
      this.states = result.states;
      this.cities = result.cities;
      this.country = result.country;

      this.form = new FormGroup({
        state: new FormControl(this.data.state || this.states[0].iso2, Validators.required),
        city: new FormControl(this.data.city || this.cities[0].name),
        line1: new FormControl(this.data.line1, [Validators.required, Validators.minLength(4)]),
        line2: new FormControl(this.data.line2, Validators.minLength(4)),
        postal_code: new FormControl(this.data.postal_code, [Validators.required, Validators.minLength(6), Validators.maxLength(6)]),
      })

      this.show = result;
      
    } catch (e) {
      if(e.status == 403) {
        return this.router.go(["user/info"]);
      }
      throw e;
    }
    
    this.loader.end();
  }

}
