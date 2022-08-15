import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';

@Component({
  selector: 'app-choose-method',
  templateUrl: './choose-method.page.html',
  styleUrls: ['./choose-method.page.scss'],
})
export class ChooseMethodPage implements OnInit {

  restaurantId: string;
  option: string;

  constructor(
    private router: RouterService,
    private loader: LoadService,
    private route: ActivatedRoute,
  ) { };

  choose(o: string) {
    if(o == "card" || o == "bank-account") {
      this.option = o;
    }
  }

  back() {
    this.router.go(["restaurant", this.restaurantId]);
  }

  next() {
    this.router.go(["add-restaurant", this.restaurantId, this.option]);
  }

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get("restaurantId");
    this.loader.end();
  }

}
