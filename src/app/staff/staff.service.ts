import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StaffService implements OnInit {

  url = environment.url + "/staff/";
  restaurantId: string;

  dishes = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }


  post<T>(body: any, ...path: string[]) {
    return this.http.post<T>(this.url + this.restaurantId + "/" + path.join("/"), body).toPromise();
  }
  get<T>(...path: string[]) {
    return this.http.get<T>(this.url + this.restaurantId + "/" + path.join("/")).toPromise();
  }
  delete<T>(...path: string[]) {
    return this.http.delete<T>(this.url + this.restaurantId + "/" + path.join("/")).toPromise();
  }

  init(restaurantId: string) {
    this.restaurantId = restaurantId;
  }

  ngOnInit(): void {
  }
}
