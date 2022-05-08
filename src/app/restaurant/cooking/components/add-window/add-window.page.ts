import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { RadminService } from 'src/app/restaurant/radmin.service';

@Component({
  selector: 'app-add-window',
  templateUrl: './add-window.page.html',
  styleUrls: ['./add-window.page.scss'],
})
export class AddWindowPage implements OnInit {

  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
  ) {
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      amount: new FormControl(null, Validators.required),
      price: new FormControl(null, Validators.required),
    });
  };

  close() {
    this.modalCtrl.dismiss();
  }
  help() { 
    console.log("NO HELP YET.");
  }

  async submit() {
    console.log(this.form.valid);
    if(this.form.valid) {
      this.modalCtrl.dismiss({component: this.form.value});
    }
  }

  ngOnInit() {
  }

}
