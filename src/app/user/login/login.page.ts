import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/main.service';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/models/user';
import { StaffService } from 'src/app/staff/staff.service';

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
    private service: StaffService,
    private cookieservice: CookieService
  ) {
    this.username = this.cookieservice.get("CTRABAUSERNAME");
  };

  async login() {
    const result = await this.main.loginFirst({ username: this.username, password: this.password }) as User;
    if(result && result.hasOwnProperty("error")) {
      const { error } = (result as unknown) as { error: string };

      if(error === 'user') {
        this.msg = "Something went wrong!";
      } else if(error === "password") {
        this.msg = "Password is wrong!";
      }
      
      this.password = "";
      return;
    } else if(result) {
      this.main.userInfo = result;
      this.cookieservice.set("CTRABAUSERID", result._id);
      this.cookieservice.set("CTRABAUSERNAME", result.username);
      if(this.main.last) {
        this.service.go(this.main.last.queryParams || {}, this.main.last.url);
      } else {
        if(result.restaurants.length > 0) {
          this.service.go({ restaurant: result.restaurants[0] }, "radmin");
        } else {
          this.service.go({}, "user-info");
        }
      }
    }
  }
  staff() {
    this.service.go({}, "staff-login");
  }
  async ngOnInit() {
  }
}
