import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
})
export class BlogPage implements OnInit {

  logged = false;

  constructor(
    private service: AdminService,
    private main: MainService,
    private router: Router
  ) { };

  type(t: string) {
    console.log(t);
  }

  goMain() {
    this.router.navigate([""]);
  }

  ngOnInit() {
    if(this.main.userInfo) {
      this.logged = true;
    }
    this.service;
  }

}
