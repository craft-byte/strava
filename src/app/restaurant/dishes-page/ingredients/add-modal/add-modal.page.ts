import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-modal',
  templateUrl: './add-modal.page.html',
  styleUrls: ['./add-modal.page.scss'],
})
export class AddModalPage implements OnInit {

  form: UntypedFormGroup;

  constructor(
    private modalCtrl: ModalController,
  ) { 
    this.form = new UntypedFormGroup({
      name: new UntypedFormControl("", Validators.required),
      price: new UntypedFormControl(null, Validators.required),
      amount: new UntypedFormControl(null),
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
