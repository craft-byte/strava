import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { User } from 'src/models/user';
import { UserService } from '../user.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit {

  user: User;
  avatar: string;

  constructor(
    private service: UserService,
    private main: MainService,
    private router: Router,
  ) { };

  logout() {
    this.main.logout();
    this.router.navigate(["login"], { replaceUrl: true, queryParamsHandling: "preserve" });
    this.main.last = null;
  }

  setAvatar() {
    this.router.navigate(["user/avatar/2"], { replaceUrl: true, queryParams: { last: this.router.url } });
  }
  email() {
    this.router.navigate(["user/email"], { replaceUrl: true, queryParams: { last: this.router.url } });
  }
  name() {
    this.router.navigate(["user/name/2"], { replaceUrl: true, queryParams: { last: this.router.url } });
  }

  exit() {
    this.router.navigate(["user/info"], { replaceUrl: true });
  }

  async ngOnInit() {
    this.user = this.main.userInfo;
    const { avatar } = await this.service.get("avatar") as any;
    this.avatar = getImage(avatar) || "./../../../assets/images/plain-avatar.jpg";
  }

}
