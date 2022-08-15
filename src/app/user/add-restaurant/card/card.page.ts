import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CreditCardValidators } from 'angular-cc-library';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.page.html',
  styleUrls: ['./card.page.scss'],
})
export class CardPage implements OnInit {

  form: FormGroup;
  restaurantId: string;

  currencies: string[] = [];

  currency: string;

  constructor(
    private loader: LoadService,
    private service: UserService,
    private route: ActivatedRoute,
    private router: RouterService,
    private toast: ToastController,
  ) { };

  back() {
    this.router.go(["add-restaurant", this.restaurantId, "choose-method"]);
  }

  curr(c: string) {
    this.currency = c;
  }

  async next() {
    if (!this.form.valid || !this.currency) {
      return;
    }

    await this.loader.start();


    try {
      const result: any = await this.service.post({ ...this.form.value, card: this.form.value.card.replaceAll(" ", ""), currency: this.currency }, "add-restaurant/set/card", this.restaurantId);

      if (result.updated) {
        this.router.go(["restaurant", this.restaurantId]);
      } else {
        (await this.toast.create({
          duration: 3000,
          color: "red",
          mode: "ios",
          message: "Something went wrong. Please try again."
        })).present();
      }
    } catch (e) {
      if (e.status == 422) {
        (await this.toast.create({
          duration: 3000,
          color: "red",
          mode: "ios",
          message: "Filled data is incorrect."
        })).present();
      }
    }
  }

  async ngOnInit() {
    await this.loader.start();
    this.restaurantId = this.route.snapshot.paramMap.get("restaurantId");
    this.form = new FormGroup({
      card: new FormControl("", [Validators.required, CreditCardValidators.validateCCNumber]),
      expYear: new FormControl(null, [Validators.required, Validators.min(new Date().getFullYear()), Validators.max(new Date().getFullYear() + 5)]),
      expMonth: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(12)]),
      cvc: new FormControl("", [Validators.required, Validators.maxLength(4), Validators.minLength(3)]),
    });

    try {
      const result: any = await this.service.get("add-restaurant/currencies");

      for(let i of result) {
        this.currencies.push(i.toUpperCase());
      }
    } catch (error) {
      this.router.go(["add-restaurant", this.restaurantId, "review"]);
      (await this.toast.create({
        duration: 3000,
        color: "red",
        mode: "ios",
        message: "Something went wrong. Please try again.",
      })).present();
    }



    this.loader.end()
  }

}
