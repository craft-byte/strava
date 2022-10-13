import { Component, OnInit } from '@angular/core';
import { LoadService } from 'src/app/other/load.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {

  constructor(
    private loader: LoadService,
  ) { }

  ngOnInit() {
    this.loader.end();
  }

}
