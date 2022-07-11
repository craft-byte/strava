import { Component, OnInit, ViewChild } from '@angular/core';
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
    private router: Router,
    private route: ActivatedRoute,
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
    const p = !this.checkPassword();
    const u = !this.checkUsername();
    if(p || u) {
      return;
    }

    this.ui.disableLogin = true;


    const result = await this.main.login({ username: this.username, password: this.password });

    const last = this.route.snapshot.queryParamMap.get("last");

    if(result) {
      if(last) {
        this.router.navigate([last], { replaceUrl: true });
      } else {
        this.router.navigate(["user/info"], { replaceUrl: true });
      }
    } else {
      this.ui.passwordMessage = "Please, check your data again";
      this.passwordInput.nativeElement.focus();
      this.ui.disableLogin = false;
    }
  }


  signUp() {
    this.router.navigate(["register"], { replaceUrl: true });
  }

  // async login() {
  //   this.disableButton = true;
  //   if(!this.password || this.password.length < 3) {
  //     this.msg = "Please provide the correct password.";
  //     this.disableButton = false;
  //     return; 
  //   }
  
  // const result = await this.main.login({ username: this.username, password: this.password });
    
  //   if(!result) {
  //     this.msg = "Check your data again.";
  //     this.disableButton = false;
  //     return;
  //   }
    
  //   if(result) {
  //     const last = this.route.snapshot.queryParams.last;
  //     if(last) {
  //       this.router.navigate([last], { replaceUrl: true, queryParams: { last: null } });
  //       return;
  //     }
  //     this.router.navigate(["user/info"], { replaceUrl: true, queryParams: { last: null }, queryParamsHandling: "merge" });
  //   } else {
  //     this.msg = "Something went wrong.";
  //   }
  // }
  async ngOnInit() {
    // const authorized = await this.service.get("login");

    // if(authorized) {
    //   this.main.userInfo = authorized as any;
    //   if(!(authorized as any).email) {
    //     return this.router.navigate(["email-setup"], { replaceUrl: true, queryParamsHandling: "merge", queryParams: { last: null } });
    //   }
    //   return this.router.navigate(["user/info"], { replaceUrl: true, queryParamsHandling: "merge", queryParams: { last: null } });
    // }
  }
}
