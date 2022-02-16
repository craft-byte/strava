import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Restaurant } from 'src/models/radmin';

@Component({
  selector: 'app-dishes',
  templateUrl: './dishes.component.html',
  styleUrls: ['./dishes.component.scss'],
})
export class DishesComponent implements OnInit {

  restaurant: Restaurant;
  page: string;

  constructor(
    private router: Router,
  ) {
    
  }

  goOther(w: "overview" | "settings") {
    this.page = w;
    this.router.navigate(['radmin', 'dishes', w], { queryParamsHandling: 'merge' });
  }

  init() {
    const r = this.router.url.split("/");
    if(r[r.length - 1].split("?")[0] === "dishes") {
      this.page = "overview";
      this.router.navigate(["radmin", "dishes", "overview"], { queryParamsHandling: "merge" });
    } else if(r[3] === "full") {
      this.page = "overview";
    } else {
      this.page = r[r.length - 1].split("?")[0];
    }
  }

  async ngOnInit() {
    this.init();
  }

}
