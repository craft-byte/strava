import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { MainService } from 'src/app/main.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {

  user;

  constructor(
    private popoverController: PopoverController,
    private main: MainService
  ) {
    this.user = this.main.userInfo;
  }

  ngOnInit() {
  }

  signin() {
    this.popoverController.dismiss("signin");
  }

  logout() {
    this.user = null;
    this.popoverController.dismiss("logout");
  }

  create() {
    this.popoverController.dismiss('create');
  }
}
