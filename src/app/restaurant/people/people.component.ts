import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss'],
})
export class PeopleComponent implements OnInit {

  page: "staff" | "customers" | "settings" = "staff";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: RadminService
  ) { }

  go(p: "staff" | "customers" | "settings") {
    this.page = p;
    this.router.navigate([p], { relativeTo: this.route, queryParamsHandling: "preserve" });
  }

  pageInit() {
    this.page = this.router.url
      .split("/")[this.router.url.split("/").length - 1]
      .split("?")[0] as "staff" | "customers" | "settings";
  }

  async ngOnInit() {
    this.pageInit();
  }

}
