import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainService } from 'src/app/main.service';
import { StaffUser } from 'src/models/staff';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-worker',
  templateUrl: './worker.page.html',
  styleUrls: ['./worker.page.scss'],
})
export class WorkerPage implements OnInit {

  restaurant: string;
  userId: string;

  user: StaffUser;

  constructor(
    private ar: ActivatedRoute,
    private service: StaffService,
    private main: MainService,
  ) { }

  async checkMainUser(): Promise<boolean> {
    await this.main.login(true);
    for(let restaurant of this.main.userInfo.restaurants) {
      if(this.restaurant === restaurant) {
        return true;
      }
    }
    return false;
  }

  async ngOnInit() {
    this.restaurant = (this.ar.snapshot.paramMap.get("restaurant"));
    this.userId = (this.ar.snapshot.paramMap.get("id"));
    const owning = await this.checkMainUser();
    if(!owning) {
      this.service.go({}, "user-info");
    }
    this.user = await this.service.get(["staffUser"], [this.userId, this.restaurant]);
  }

}
