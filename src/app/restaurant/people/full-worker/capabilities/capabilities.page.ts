import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RadminService } from 'src/app/restaurant/radmin.service';
import { ManagerSettings } from 'src/models/components';

@Component({
  selector: 'app-capabilities',
  templateUrl: './capabilities.page.html',
  styleUrls: ['./capabilities.page.scss'],
})
export class CapabilitiesPage implements OnInit {

  constructor(
    private service: RadminService,
    private modalCtrl: ModalController
  ) { };


  @Input() name: string;
  @Input() settings: ManagerSettings;
  @Input() userId: string;


  close() {
    this.modalCtrl.dismiss();
  }


  setSetting(f1: string, f2: string) {
    this.settings[f1][f2] = !this.settings[f1][f2];    

    this.service.post({ f1, f2, value: this.settings[f1][f2] }, "staff", this.userId, "settings/update");
  }

  ngOnInit() {
    console.log(this.settings);
  }

}
