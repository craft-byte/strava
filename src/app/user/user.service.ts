import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Restaurant, User, UserResponse, Restaurant2 } from 'src/models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  url = environment.url + "/user";

  
  constructor(
    private http: HttpClient,
    private router: Router
  ) { };



  get<T>(...str: string[]) {
    return this.http.get<T>(this.url + "/" + str.join("/")).toPromise();
  }
  patch<T>(body: any, ...path: (string | number)[]) {
    return this.http.patch<T>(this.url + "/" + path.join("/"), body).toPromise();
  }
  post<T>(body: any, ...path: string[]) {
    return this.http.post<T>(this.url + "/" + path.join("/"), body).toPromise();
  }


  createAccount(data: any) {
    return this.http.post<{ acknowledged: boolean; error: string; user: { username: string; restaurants: string[]; works: string[]; invitations: string[] } }>(`${this.url}/create`, data).toPromise();
  }
  addRestaurant(restaurant: any) {
    return this.http.post<{ error: "none" | "wrong"; insertedId: string; }>(`${this.url}/addRestaurant`, { restaurant }).toPromise();
  }
}
