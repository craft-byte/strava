import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { IonSlides, ToastController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { getImage } from 'src/functions';
import { UserService } from '../user.service';

@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss'],
})
export class AddRestaurantPage implements OnInit, AfterViewInit {

  @ViewChild(IonSlides) slides: IonSlides;

  name: string = "";
  logo: File = null;
  theme: string = null;

  image: string = null;

  disableAddButton = false;

  slideOpts = {
    allowSlideNext: false
  };

  constructor(
    private toastCtrl: ToastController,
    private service: UserService,
    private main: MainService,
    private router: Router
  ) {
  };

  nextSlide(){
    this.slides.lockSwipes(false);
    this.slides.slideNext();
    this.slides.lockSwipes(true);
  }
  back() {
    this.slides.lockSwipes(false);
    this.slides.slidePrev();
    this.slides.lockSwipes(true);
  }

  async setImage(files: FileList) {
    const file: File = files.item(0);

    const name = file.name.split(".");

    if (!["jpg", "jpeg", "JPG", "JPEG", "jfif", "svg"].includes(name[name.length - 1]) || !file) {
      console.log("UNSUPPORTED FILE EXTENSION");
      return;
    }

    this.logo = file;

    this.image = await getImage(file);
  }

  async create() {
    this.disableAddButton = true;
    const newRestaurant = {
      logo: this.logo,
      name: this.name,
      theme: this.theme,
    };

    const result = await this.service.addRestaurant(newRestaurant);

    if(result.error == "none") {
      this.main.userInfo.restaurants.push(result.insertedId);
      this.main.userInfo.works.push(result.insertedId);
      this.router.navigate(["restaurant", result.insertedId], { queryParamsHandling: "preserve", replaceUrl: true });
    } else {
      (await this.toastCtrl.create({
        message: "Something went wrong. Try again later.",
        duration: 4000
      })).present();
    }
  }

  nameSubmit() {
    if(this.name && this.name.length > 0) {
      this.nextSlide();
      this.slideOpts.allowSlideNext = true;
    }
  }
  imageSubmit() {
    if(this.logo) {
      this.nextSlide();
    }
  }
  themeSubmit() {
    if(this.theme) {
      this.nextSlide();
    }
  }

  onSlide() {
    this.slideOpts.allowSlideNext = false;
  }

  choose(color: string) {
    this.theme = color;
  }


  async ngOnInit() {
    if(!this.main.userInfo.email) {
      this.router.navigate(["email-setup"], { queryParamsHandling: "preserve", replaceUrl: true });
    }
  }

  ngAfterViewInit() {
    this.slides.lockSwipes(true);
  }

}
