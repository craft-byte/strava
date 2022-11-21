import { Component, OnInit } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { LoadService } from 'src/app/other/load.service';
import { RouterService } from 'src/app/other/router.service';
import { getImage } from 'src/functions';
import { RestaurantService } from '../../restaurant.service';

interface Worker {
  name: string;
  _id: string;
  date: string;
  avatar: string;
  username: string;
  role: string;
}

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss'],
})
export class StaffComponent implements OnInit {

  staff: Worker[] = [];
  mode: string = "solo";

  constructor(
    private service: RestaurantService,
    private router: RouterService,
    private loader: LoadService,
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
  ) { };


  async ngOnInit() {
    const result: any = await this.service.get({}, "staff");

    if(result) {
        this.mode = result.mode;

        if(result.mode != "solo" && result.mode != "disabled") {
            for(let i of result.people) {
              this.staff.push({
                ...i,
                avatar: getImage(i.avatar),
              });
            }
        }
    }

  }

}
