import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Restaurant } from 'src/models/general';
import { RadminService } from '../radmin.service';

@Component({
  selector: 'app-dishes',
  templateUrl: './dishes.component.html',
  styleUrls: ['./dishes.component.scss'],
})
export class DishesComponent implements OnInit {

  restaurant: string;
  page: string;

  constructor(
    private router: Router,
    private service: RadminService,
    private route: ActivatedRoute
  ) {
    
  }

  goOther(w: "overview" | "settings") {
    this.page = w;
    this.router.navigate([w], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }

  init() {
    const r = this.router.url.split("/");
    if(r[r.length - 1].split("?")[0] === "dishes") {
      this.page = "overview";
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
