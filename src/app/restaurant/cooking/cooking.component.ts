import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Restaurant } from 'src/models/general';

@Component({
  selector: 'app-cooking',
  templateUrl: './cooking.component.html',
  styleUrls: ['./cooking.component.scss'],
})
export class CookingComponent implements OnInit {

  restaurant: Restaurant;
  page: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    
  }

  goOther(w: "components" | "settings" | "overview") {
    this.page = w;
    this.router.navigate([w], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }

  init() {
    const r = this.router.url.split("/");
    if(r[r.length - 1].split("?")[0] === "dishes") {
      this.page = "components";
      this.router.navigate(["components"], { relativeTo: this.route, queryParamsHandling: "preserve" });
    } else if(r[3] === "full") {
      this.page = "components";
    } else {
      this.page = r[r.length - 1].split("?")[0];
    }
  }

  async ngOnInit() {
    this.init();
  }
}
