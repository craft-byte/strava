import { Component, OnInit } from '@angular/core';
import { LegendPosition } from '@swimlane/ngx-charts';
import { RestaurantService } from '../../restaurant.service';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
})
export class ChartsComponent implements OnInit {

  chart = {
    multi: [],
    // view: ([230, 200] as [number, number]),

    // options
    legend: true,
    showLabels: true,
    animations: false,
    xAxis: true,
    yAxis: true,
    showYAxisLabel: true,
    showXAxisLabel: true,
    timeline: false,
    showGridLines: true,
    showChart: false,
    legendTitle: "Gross volume",
    legendPosition: LegendPosition.Right,

    colorScheme: ({
      domain: ['#ffc409', "#ce9f05"]
    } as any),
  }

  constructor(private service: RestaurantService) { }


  addDollarSign = (val: string) => {
    return `$${val}`;
  };

  async ngOnInit() {

    if(window.innerWidth < 700) {
      this.chart.legendPosition = LegendPosition.Below;
    }

    try {
        const result: any = await this.service.get({}, "charts");

    
        if(!result) {
            this.chart.showChart = false;
            return;
        }
    
        this.chart.multi = [result];
        if(result) {
          this.chart.showChart = true;
        }
    } catch (e) {
        if(e.status == 403) {
            if(e.body.reason == "RestaurantNotEnabled") {
                this.chart.showChart = false;
            }
        }
    }
    
  }

}
