import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/models/user';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  username = "";
  password = "";

  msg = "";

  constructor(
    private main: MainService,
    private service: UserService,
    private cookieservice: CookieService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.username = this.cookieservice.get("CTRABAUSERID");
  };

  async login() {
    if(!this.password || this.password.length < 3) {
      this.msg = "Please provide the correct password.";
      return;
    }
    const result = await this.main.login({ username: this.username, password: this.password });
    if(result.hasOwnProperty("error")) {
      this.msg = "Something went wrong.";
      return;
    }
    if(result) {
      const last = this.route.snapshot.queryParams.last;
      if(last) {
        this.router.navigate([last], { replaceUrl: true, queryParams: { last: null } });
        return;
      }
      this.router.navigate(["user/info"], { replaceUrl: true, queryParams: { last: null }, queryParamsHandling: "merge" });
    } else {
      this.msg = "Something went wrong.";
    }
  }
  async ngOnInit() {
    // const authorized = await this.main.auth(this.main.userInfo ? "false" : "true") as User;
    // if(!authorized) {
    //   return;
    // }
    // if(!authorized.email) {
    //   this.router.navigate(["email-setup"], { replaceUrl: true, queryParamsHandling: "preserve" });
    // }
    // this.main.userInfo = authorized;
    // this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "preserve" });
    const authorized = await this.service.get("login");

    if(authorized) {
      this.main.userInfo = authorized as any;
      if(!(authorized as any).email) {
        return this.router.navigate(["email-setup"], { replaceUrl: true, queryParamsHandling: "merge", queryParams: { last: null } });
      }
      return this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "merge", queryParams: { last: null } });
    }
  }
}
