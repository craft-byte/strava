import { Injectable } from '@angular/core';
import { LoginData, User } from 'src/models/user';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class MainService {

  userInfo: User;
  last: { url: string, queryParams?: any };

  confirmType: "remove" | "restaurant";
  type: string;

  info = {
    staffLogin: null,
    restaurantId: null
  }

  constructor(
    private cookies: CookieService,
    private http: HttpClient,
    private router: Router
  ) {
  };

  isOwner(restaurant: string) {
    for(let i of this.userInfo.restaurants) {
      if(i === restaurant) {
        return true;
      }
    }
    return false;
  }
  async login(data?: LoginData) {
    try {
      const result = await this.http.patch<any>(environment.url + '/user/login', data).toPromise(); 
      this.userInfo = result.user;
      this.setUserInfo(result.user.username);
      return result.redirectTo;
    } catch (error) {
      return false;
    }
  }
  auth(s: string) {
    return this.http.get(environment.url + "/user/authenticate/" + s);
  }
  logout() {
    this.userInfo = null;
    this.http.delete(environment.url + "/user/logout").toPromise();
  }

  public setUserInfo(id: string) {
    this.cookies.set("CTRABAUSERID", id);
  }


  confirm(t: "restaurant" | "remove", r?: string) {
    this.router.navigate(["confirm"], { replaceUrl: true });
    this.confirmType = t;
    this.type = r;
  }

  allowed(page: string, restaurantId: string) {
    return this.http.post<boolean>(`${environment.url}/user/allowed`, { page, restaurantId }).toPromise();
  }
}
