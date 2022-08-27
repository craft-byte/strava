import { Component, OnInit, ViewChild } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/models/user';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { threadId } from 'worker_threads';
import { RouterService } from 'src/app/other/router.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  @ViewChild("passwordElement") passwordInput: any;

  password: string = "";
  username: string = "";

  ui = {
    usernameRed: false,
    passwordRed: false,
    usernameMessage: "",
    passwordMessage: "",
    disableLogin: false,
  }

  constructor(
    private main: MainService,
    private cookieservice: CookieService,
    private router: RouterService,
    private route: ActivatedRoute,
    private loader: LoadService,
  ) {
    this.username = this.cookieservice.get("CTRABAUSERID");
  };


  checkUsername() {
    if(this.username.length < 6 || this.username.length > 30) {
      this.ui.usernameRed = true;
      this.ui.usernameMessage = "Username length must be more than 6 and less than 30 characters";
      return;
    } else if(/[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?" +"]/.test(this.username)) {
      this.ui.usernameRed = true;
      this.ui.usernameMessage = "Username can contain only A-Z a-z 0-9 and _ characters";
      return;
    }
    return true;
  }

  checkPassword() {
    if(this.password.length < 8) {
      this.ui.passwordRed = true;
      this.ui.passwordMessage = "Password can't be less than 8 characters";
      return;
    }
    this.ui.passwordRed = false;
    this.ui.passwordMessage = "";
    return true;
  }


  onEnter() {
    if(!this.checkUsername()) {
      return;
    }

    this.ui.usernameRed = false;
    this.ui.usernameMessage = "";

    this.passwordInput.nativeElement.focus();
  }


  async login() {
    this.ui.disableLogin = true;
    const p = !this.checkPassword();
    const u = !this.checkUsername();
    if(p || u) {
      this.ui.disableLogin = false;
      return;
    }

    await this.loader.start();



    const result = await this.main.login({ username: this.username, password: this.password });

    const last = this.route.snapshot.queryParamMap.get("last");

    if(result) {
      if(last) {
        this.router.go([last], { replaceUrl: true });
      } else if(result) {
        this.router.go([result], { replaceUrl: true });
      } else {
        this.router.go(["user/info"]);
      }
    } else {
      this.ui.passwordMessage = "Please, check your data again";
      this.passwordInput.nativeElement.focus();
      this.ui.disableLogin = false;
      this.loader.end();
    }
  }


  signUp() {
    this.router.go(["register"], { replaceUrl: true });
  }

  async ngOnInit() {
    this.loader.end();
  }
}
