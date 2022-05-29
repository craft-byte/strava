import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-modal',
  templateUrl: './add-modal.page.html',
  styleUrls: ['./add-modal.page.scss'],
})
export class AddModalPage implements OnInit {

  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
  ) { 
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      price: new FormControl(null, Validators.required),
      amount: new FormControl(null),
    })
  };

  close() {
    this.modalCtrl.dismiss();
  }

  add() {
    if(this.form.valid) {
      this.modalCtrl.dismiss(this.form.value);
    }
  }

  ngOnInit() {
  }

}
