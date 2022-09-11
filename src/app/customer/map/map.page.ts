import { Component, OnInit } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { CustomerService } from '../customer.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {


  constructor(
    private loader: LoadService,
    private router: RouterService,
    private service: CustomerService,
  ) { }

  back() {
    this.router.go(["user/info"]);
  }


  async ngOnInit() {

    this.loader.end();
  }

}
