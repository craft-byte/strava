import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Restaurant } from 'src/models/radmin';

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
  ) {
    
  }

  goOther(w: "components" | "settings") {
    this.page = w;
    this.router.navigate(['radmin', 'cooking', w], { queryParamsHandling: 'merge' });
  }

  init() {
    const r = this.router.url.split("/");
    if(r[r.length - 1].split("?")[0] === "dishes") {
      this.page = "components";
      this.router.navigate(["radmin", "dishes", "components"], { queryParamsHandling: "merge" });
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
