import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MainService } from 'src/app/main.service';
import { payments } from 'src/assets/consts';
import { UserService } from '../user.service';

@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss'],
})
export class AddRestaurantPage implements OnInit {

  addForm: FormGroup;

  types = payments;

  ui = {
    title: "Add Restaurant"
  }

  constructor(
    private main: MainService,
    private service: UserService
  ) {
    this.addForm = new FormGroup({
      name: new FormControl(""),
      sname: new FormControl(""),
      kitchenPassword: new FormControl(""),
      payments: new FormControl(null),
      adminPassword: new FormControl("")
    });
  }

  info() {
    console.log("info");
  }
  async add() {
    const { name, sname, kitchenPassword, payments, adminPassword } = this.addForm.value;
    if(
      name.length == 0 ||
      sname.length == 0 ||
      kitchenPassword.length == 0 ||
      adminPassword.length == 0 ||
      payments.length == 0 || !payments
    ) {
      this.ui.title = "Something Went Wrong!"
      return;
    }
    const result = await this.service.addRestaurant({ name, sname, kitchenPassword, payments, adminPassword }, this.main.userInfo._id);
    if(result && result.acknowledged) {
      this.main.userInfo.restaurants.push(result.insertedId);
      this.main.userInfo.works.push(result.insertedId);
      this.service.go({ restaurant: result.insertedId }, "radmin");
    }
  }


  async ngOnInit() {
    await this.main.login(true);

  }

}
