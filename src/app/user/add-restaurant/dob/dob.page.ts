import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { months } from 'server/src/assets/consts';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-dob',
  templateUrl: './dob.page.html',
  styleUrls: ['./dob.page.scss'],
})
export class DobPage implements OnInit {

  restaurantId: string;
  months = months;

  ui = {
    year: false,
    month: false,
    day: false,
    title: "Ctraba"
  }

  form: FormGroup;

  constructor(
    private router: RouterService,
    private route: ActivatedRoute,
    private service: UserService,
    private loader: LoadService,
    private toast: ToastController,
  ) { };



  async submit() {
    await this.loader.start();
    this.ui = {
      year: false,
      month: false,
      day: false,
      title: "Ctraba"
    };

    const { year, month, day } = this.form.value; 

    if(!this.form.valid) {
      this.loader.end();
      return;  
    }

    if((year == 2022 && new Date().getMonth() < month)) {
      this.ui.month = true;
      return;
    } else if(
      (day == 31 && !["Jan", "Mar", "May", "Jul", "Aug", "Oct", "Dec"].includes(months[month])) ||
      (months[month] == "Feb" && day > 28) ||
      (year == new Date().getFullYear() && month > new Date().getMonth()) ||
      (year == new Date().getFullYear() && month == new Date().getMonth() && day > new Date().getDate())
    ) {
      this.ui.day = true;
      return;
    }



    try {
      const result: any = await this.service.post({ year, month: +month + 1, day }, "add-restaurant/set/dob", this.restaurantId);    
  
      
      if(result.updated) {
        this.router.go(["add-restaurant", this.restaurantId, "address"]);
        return;
      } else {
        (await this.toast.create({
          duration: 2000,
          mode: "ios",
          message: "Something went wrong. Please try again.",
          color: "red",
        })).present();
      }
    } catch (error: any) {
      if(error.status == 422) {
        (await this.toast.create({
          duration: 2000,
          mode: "ios",
          message: "Filled data is incorrect.",
          color: "red",
        })).present();
      } else if(error.status == 400) {
        
      }
      this.loader.end();
    }


    this.loader.end();
  }

  back() {
    this.router.go(["restaurant", this.restaurantId]);
  }
  
  async ngOnInit() {
    await this.loader.start();
    this.restaurantId = this.route.snapshot.paramMap.get("restaurantId");

    const result: any = await this.service.get("add-restaurant/dob");

    this.form = new FormGroup({
      year: new FormControl(result?.year || null, [Validators.max(new Date().getFullYear()), Validators.min(1900), Validators.required]),
      month: new FormControl(result?.month - 1 || 0, [Validators.required]),
      day: new FormControl(result?.day || null, [Validators.max(31), Validators.min(1), Validators.required]),
    });

    
    this.loader.end();
  }
}
