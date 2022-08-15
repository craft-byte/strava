import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { RestaurantService } from '../services/restaurant.service';

interface Result {
  nextUrl?: string;
  status?: string;
  nextEventuallyUrl?: string;
  money: {
    card: string;
    cash: string;
    payouts: string;
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  data: Result;

  chart = {
    multi: [
      {
        "name": "Germany",
        "series": [
          {
            "name": "1990",
            "value": 62000000
          },
          {
            "name": "2010",
            "value": 73000000
          },
          {
            "name": "2011",
            "value": 89400000
          }
        ]
      },
    
      {
        "name": "USA",
        "series": [
          {
            "name": "1990",
            "value": 250000000
          },
          {
            "name": "2010",
            "value": 309000000
          },
          {
            "name": "2011",
            "value": 311000000
          }
        ]
      },
    
      {
        "name": "France",
        "series": [
          {
            "name": "1990",
            "value": 58000000
          },
          {
            "name": "2010",
            "value": 50000020
          },
          {
            "name": "2011",
            "value": 58000000
          }
        ]
      },
      {
        "name": "UK",
        "series": [
          {
            "name": "1990",
            "value": 57000000
          },
          {
            "name": "2010",
            "value": 62000000
          }
        ]
      }
    ],
    view: [600, 250],

    // options
    legend: false,
    showLabels: true,
    animations: false,
    xAxis: false,
    yAxis: false,
    showYAxisLabel: false,
    showXAxisLabel: false,
    timeline: true,
    gridLines: true,
    showGridLines: true,

    colorScheme: {
      domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
    },
  }

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private loader: LoadService,
    private toastCtrl: ToastController,
  ) { };


  continue() {
    this.router.go([this.data.nextUrl]);
  }
  finish() {
    this.router.go([this.data.nextEventuallyUrl]);
  }

  go(page: string) {
    this.router.go(["restaurant", this.service.restaurantId, page]);
  }

  async ngOnInit() {
    await this.loader.start();

    try {
      const result = await this.service.get<Result>("home");
      console.log(result);
      this.data = result;
    } catch (e) {
      if(e.status == 404) {
        this.router.go(["user/info"]);
        (await this.toastCtrl.create({
          duration: 1500,
          color: "red",
          message: "Not found",
          mode: "ios",
        })).present();
        console.error("404 ERROR");
      } else if(e.status == 403) {
        this.router.go(["user/info"]);
        (await this.toastCtrl.create({
          duration: 1500,
          color: "red",
          message: "You are not allowed to be there",
          mode: "ios",
        })).present();
      }
      return;
    }

    this.loader.end();
  }

}
