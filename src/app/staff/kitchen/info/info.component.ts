import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { getImage } from 'src/functions';
import { InfoDish } from 'src/models/staff';
import { StaffService } from '../../staff.service';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent implements OnInit, OnDestroy {

  dish: InfoDish = null;
  show = false;
  image: string;

  subscription: Subscription;

  constructor(
    private service: StaffService
  ) {
    this.subscription = this.service.infoId.asObservable().subscribe(res => {
      if(this.dish && this.dish._id === res) {
        this.show = true;
        return;
      }
      this.init(res);
    });
  }

  close() {
    this.show = false;
  }

  async init(id: string) {
    this.dish = await this.service.get(['infoDish'], [this.service.restaurant, this.service.sname, id]);
    this.image = await getImage(this.dish.image);
    if(this.dish) {
      this.show = true;
    }
  }

  ngOnInit() {
    
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
