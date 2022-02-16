import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainService } from 'src/app/main.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-danger',
  templateUrl: './danger.page.html',
  styleUrls: ['./danger.page.scss'],
})
export class DangerPage implements OnInit {

  type: "password" | "remove";

  username = "";
  password = "";
  newPassword = "";

  constructor(
    private service: UserService,
    private main: MainService,
    private ar: ActivatedRoute
  ) { };

  async submit() {
    if(this.type == "password") {
      const result = await this.service.password({
          username: this.username, 
          password: this.password, 
          newPassword: this.newPassword, 
          _id: this.main.userInfo._id 
        });
      if(!result.acknowledged) {
        console.log(result.error);
      } else {
        this.service.go({}, "user-info");
      }
    } else {
      this.service.removeUser({ username: this.username, password: this.password, _id: this.main.userInfo._id });
      this.service.go({}, 'login');
  
    }
  }

  ngOnInit() {
    if(!this.main.userInfo) {
      this.service.go({}, "login");
    }
    this.type = this.ar.snapshot.paramMap.get("type") as "password" | "remove";
  }

}
