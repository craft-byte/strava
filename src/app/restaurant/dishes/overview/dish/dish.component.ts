import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, PopoverController } from '@ionic/angular';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { Dish } from 'src/models/dish';
import { SettingsComponent } from '../settings/settings.component';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
})
export class DishComponent implements OnInit {

  date: string;

  constructor(
    private service: RadminService,
    private router: Router,
    private popoverController: PopoverController,
    private alertCtrl: AlertController
  ) { }

  @Input() data: Dish;
  @Output() Emitter = new EventEmitter();


  async openPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: SettingsComponent,
      event: ev,
      translucent: false,
      mode: "ios",
    });
    await popover.present();

    const { role } = await popover.onDidDismiss();


    switch (role) {
      case "remove": 
        this.remove();
        break;
      case "edit":
        this.Emitter.emit({ t: "edit", _id: this.data._id });
        break;
      case "more":
        this.go();
        break;
    }
  }

  go() {
    this.router.navigate(['restaurant', this.service.restaurant._id, 'dishes', 'full', this.data._id], { queryParamsHandling: "preserve" });
  }
  async remove() {
    const alert = await this.alertCtrl.create({
      mode: "ios",
      header: 'Please be certain.',
      subHeader: '',
      message: 'Once you delete a dish, there is no going back.',
      buttons: [{ text: "Cancel", role: null }, { text: "Remove", role: "remove" }]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if(role == "remove") {
      await this.service.delete('dishes', this.data._id);
      this.Emitter.emit({ t: "remove", _id: this.data._id });
    }
  }
  


  ngOnInit() {

    const date = new Date((this.data as any).date);

    this.date = date.toLocaleDateString();
  }

}
