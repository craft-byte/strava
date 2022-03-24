import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NewUser, PostResult, Restaurant, User, UserResponse, Restaurant2 } from 'src/models/user';

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


  confirm(t: "restaurant" | "remove", data: any) {
    return this.http.patch<{ removed: boolean; id: string }>(`${this.url}/confirm/${t}`, data).toPromise();
  }
  go(p: Object, ...paths: string[]) {
    this.router.navigate(paths, { replaceUrl: true, queryParams: p });
  }
  update(data: { username?: string, phone?: string, name?: string }, user: string) {
    return this.http.patch<UserResponse>(`${this.url}/update/${user}`, data).toPromise();
  }
  getRestaurants(user: string) {
    return this.http.get<Restaurant[]>(`${this.url}/restaurants/${user}`).toPromise();
  }
  getRestaurantName(id: string) {
    return this.http.get<Restaurant2>(`${this.url}/name/${id}`).toPromise();
  }
  removeUser(data: { password: string, username: string, _id: string}) {
    return this.http.patch<UserResponse>(`${this.url}/removeUser`, data).toPromise();
  }
  password(data: { password: string, newPassword: string, username: string, _id: string}) {
    return this.http.patch<UserResponse>(`${this.url}/changePassword`, data).toPromise();
  }
  accept(restaurant: string, answer: boolean, user: { username: string, _id: string }) {
    return this.http.patch(`${this.url}/accept`, { restaurant, answer, user }).toPromise();
  }
  restaurantName(sname: string) {
    return this.http.get<{name: string}>(`${this.url}/name/${sname}`).toPromise();
  }
  invite(id: string, restaurant: string) {
    return this.http.get(`${this.url}/invite/${id}/${restaurant}`).toPromise();
  }
  getUserInfo(username: string) {
    return this.http.get<User>(`${this.url}/userInfo/${username}`).toPromise();
  }
  createAccount(data: NewUser) {
    return this.http.post<{ acknowledged: boolean; user: { username: string; restaurants: string[]; works: string[]; invitations: string[] } }>(`${this.url}/create`, data).toPromise();
  }
  addRestaurant(restaurant: any, user: string) {
    return this.http.post<PostResult>(`${this.url}/addRestaurant`, { restaurant, _id: user }).toPromise();
  }
  getRestaurant(username: string) {
    return this.http.get<{restaurants: Restaurant[]}>(`${this.url}/restaurants/${username}`).toPromise();
  }
}
