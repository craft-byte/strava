import { Component, Input, OnInit } from '@angular/core';
import { ConvertedFeedback } from 'src/models/user';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
})
export class FeedbackComponent implements OnInit {

  constructor() { };

  @Input() data: ConvertedFeedback;

  ngOnInit() {}

}
