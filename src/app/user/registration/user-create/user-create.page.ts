import { StringMapWithRename } from '@angular/compiler/src/compiler_facade_interface';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { environment } from 'src/environments/environment';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.page.html',
  styleUrls: ['./user-create.page.scss'],
})
export class UserCreatePage implements OnInit {

  password = null;
  confirm = null;
  username = null;

  ui = {
    usernameRed: false,
    passwordRed: false,
    confirmRed: false,
    usernameMessage: "",
    passwordMessage: "",
    confirmMessage: "",
    disableButtons: false,
  }

  constructor(
    private service: UserService,
    private main: MainService,
    private modalCtrl: ModalController,
    private router: Router
  ) { };

  checkPassword(event: any) {
    const { target: { value } } = event;

    if(value.length < 8) {
      this.ui.passwordRed = true;
      this.ui.passwordMessage = "Sorry, your password must contain minimum of 8 letters";
      return;
    }
    this.ui.passwordRed = false;
    this.ui.passwordMessage = "";
    this.password = value;
    if(this.confirm == value) {
      this.ui.confirmRed = false;
      this.ui.confirmMessage = "";
    }
  }
  async checkUsername(event: any) {
    const { target: { value } } = event;

    this.username = null;

    if(value.length < 6 || value.length > 30) {
      this.ui.usernameRed = true;
      this.ui.usernameMessage = "Sorry, your username must be between 6 and 30 characters long";
      return;
    }
    if(/[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?" +"]/.test(value)) {
      this.ui.usernameRed = true;
      this.ui.usernameMessage = "Sorry, your username can contain only A-Z a-z 0-9 and _ characters ";
      return;
    }
    
    const result = await this.service.post({ username: value }, "username/check");
    
    console.log('result: ', result);

    if(!result) {
      this.ui.usernameRed = true;
      this.ui.usernameMessage = "Sorry, the username is taken";
      return;
    }
    
    
    this.ui.usernameRed = false;
    this.ui.usernameMessage = "";
    this.username = value;
  }
  checkConfirm(event: any) {
    const { target: { value } } = event;

    this.confirm = null;

    if(this.password.length < 8) {
      return;
    }

    if(value != this.password) {
      this.ui.confirmRed = true;
      this.ui.confirmMessage = "Password are not the same";
      return;
    }

    this.ui.confirmRed = false;
    this.ui.confirmMessage = "";
    this.confirm = value;
  }

  async signUp() {
    console.log("CLICKED");
    this.ui.disableButtons = true;
    if(!this.username) {
      this.ui.disableButtons = false;
      return this.ui.usernameRed = true;
    }
    if(!this.confirm) {
      this.ui.disableButtons = false;
      return this.ui.passwordRed = true;
    }

    const result = await this.service.createAccount({ username: this.username, password: this.password });

    if(result.acknowledged) {
      this.main.userInfo = result.user;
      return this.router.navigate(["user/name/1"], { replaceUrl: true });
    } else {
      this.ui.disableButtons = false;
      if(result.error == "username") {
        this.ui.usernameRed = true;
        this.ui.usernameMessage = "Sorry, your username is not allowed";
      } else if(result.error == "password") {
        this.ui.passwordRed = true;
        this.ui.passwordMessage = "Sorry, you password is not allowed";
      }
    }

  }

  signIn() {
    this.router.navigate(["login"], { replaceUrl: true });
  }

  ngOnInit() {
    
  }

}
