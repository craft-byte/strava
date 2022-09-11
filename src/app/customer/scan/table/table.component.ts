import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit {

  constructor(
    private modalCtrl: ModalController,
  ) { };

  @Input() tables: any[];
  @Input() showOrderButton: boolean;
  @Input() theme: string;

  select(t: any) {
    this.modalCtrl.dismiss(t.id);
  }
  order() {
    this.modalCtrl.dismiss(null, "order");
  }
  cancel() {
    this.modalCtrl.dismiss();
  }

  ngOnInit() {
    
  }

}
