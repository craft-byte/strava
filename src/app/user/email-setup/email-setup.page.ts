import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-email-setup',
  templateUrl: './email-setup.page.html',
  styleUrls: ['./email-setup.page.scss'],
})
export class EmailSetupPage implements OnInit {

  disable = false;

  email: string = null;
  code: string = null;

  msg: string = "";

  constructor(
    private main: MainService,
    private service: UserService,
    private router: Router
  ) { };


  verifyEmail() {
    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return format.test(this.email);
  }

  clear() {
    this.email = null;
    this.disable = false;
  }

  async verify() {
    if(this.code) {
      const result = await this.service.post<{ error: "none" }>({ code: this.code }, "email/verify");

      if(result.error == "none") {
        this.main.userInfo.email = this.email;
        this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "preserve" });
      } else {
        this.msg = "Something went wrong. Try again later.";
      }
    }
  }

  async sendCode() {
    this.disable = true;
    if(this.email && this.verifyEmail()) {
      const result = await this.service.post<{ error: "none" | "used" }>({ email: this.email }, "email/setEmail");
      if(result.error == "none") {
        return;
      } else if(result.error == "used") {
        this.msg = "This email address is already in use.";
      } else {
        this.msg = "Something went wrong. Try again later.";
      }
    } else {
      this.msg = "Please, provide the correct email address.";
    }
  }


  ngOnInit() {
    console.log(this.service);
  }

}
