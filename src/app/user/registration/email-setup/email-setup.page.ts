import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-email-setup',
  templateUrl: './email-setup.page.html',
  styleUrls: ['./email-setup.page.scss'],
})
export class EmailSetupPage implements OnInit {

  email: string;

  ui = {
    emailRed: false,
    disableCode: true,
    disableSubmit: true,
    disableSend: false,
    sent: false,
    emailMessage: "",
    codeMessage: "",
    countdown: 0,
    username: ""
  }

  constructor(
    private main: MainService,
    private service: UserService,
    private router: Router,
    private route: ActivatedRoute,
  ) { };

  exit() {
    const last = this.route.snapshot.queryParamMap.get("last");
    if(last) {
      this.router.navigate([last], { replaceUrl: true });
    } else {
      this.router.navigate(["user/info"], { replaceUrl: true });
    }
  }

  async onCodeCompleted(code: number) {
    this.ui.disableCode = true;

    const result = await this.service.post<{ error: "email" | "code1" | "code2" | "none" }>({ code }, "email/verify");

    if(result.error == "email") {
      this.ui.disableCode = true;
      this.ui.emailRed = true;
      this.ui.emailMessage = "Your email was not set yet";
    } else if(result.error == "code1") {
      this.ui.disableSend = false;
      this.ui.sent = false;
    } else if(result.error == "code2") {
      this.ui.disableCode = false;
      this.ui.codeMessage = "Code is incorrect";
    } else if(result.error == "none") {
      this.ui.disableSubmit = false;
      this.main.userInfo.email = this.email;
      const last = this.route.snapshot.queryParamMap.get("last");
      if(last) {
        this.router.navigate([last], { replaceUrl: true });
      } else {
        this.router.navigate(["user/avatar/1"], { replaceUrl: true });
      }
    }

  }

  emailInput(event: any) {
    const { target: { value } } = event;
    this.email = value;
    this.ui.sent = false;
    this.ui.disableSend = false;
  }

  resend() {
    this.ui.countdown = 60;
    
    const interval = setInterval(() => {
      this.ui.countdown -= 1;
      if(this.ui.countdown < 0) {
        clearInterval(interval);
        this.ui.countdown = 0;
      }
    }, 1000);

    this.send();
  }

  async send() {
    this.ui.disableSend = true;
    
    const pass = await this.verifyEmail();
    
    if(!pass) {
      this.ui.disableSend = false;
      return;
    }
    
    this.ui.sent = true;

    const result = await this.service.post<{ acknowledged: boolean; error: string; }>({ email: this.email }, "email/setEmail");

    if(!result.acknowledged) {
      this.ui.disableCode = true;
      this.ui.disableSend = false;
      if(result.error == "used") {
        this.ui.emailRed = true;
        this.ui.emailMessage = "Your email is already taken";
      } else if(result.error == "wrong") {
        this.ui.emailRed = true;
        this.ui.emailMessage = "Your email is not correct";
      }
      return;
    }
    this.ui.disableCode = false;
  }

  async verifyEmail() {
    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    if(!format.test(this.email)) {
      this.ui.emailRed = true;
      this.ui.emailMessage = "Your email is not correct";
      return false;
    }
    const result = await this.service.post({ email: this.email }, "email/check");

    if(!result) {
      this.ui.emailRed = true;
      this.ui.emailMessage = "Your email is already taken";
      return false;
    }

    this.ui.emailRed = false;
    this.ui.emailMessage = "";
    return result;
  }

  async ngOnInit() {
    this.ui.username = this.main.userInfo.username;
    const is: any = await this.service.get("email/setup");
    if(is) {
      if(is.emailVerify && typeof is.emailVerify == "string") {
        this.email = is.emailVerify;
        if(is.emailVerificationCode) {
          this.ui.sent = true;
          this.ui.disableCode = false;
        }
      }
    }
  }

}
