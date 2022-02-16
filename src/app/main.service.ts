import { Injectable } from '@angular/core';
import { LoginData, User } from 'src/models/user';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

const RESTAURANTPATH = "CTRABACURRENTRESTAURANTID";
const USERIDPATH = "CTRABACURRENTUSERID";
const TABLEPATH = "CTRABACURRENTTABLE";
const SESSIONPATH = "CTRABASESSIONTYPE";


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

  restaurant = {
    get: () => {
      return this.cookies.get(RESTAURANTPATH);
    },
    set: (id: string) => {
      return this.cookies.set(RESTAURANTPATH, id);
    }
  }
  user = {
    get: () => {
      return this.cookies.get(USERIDPATH);
    },
    set: (id: string) => {
      return this.cookies.set(USERIDPATH, id);
    }
  }
  table = {
    get: () => {
      return this.cookies.get(TABLEPATH);
    },
    set: (t: string) => {
      return this.cookies.set(TABLEPATH, t);
    }
  }
  session = {
    get: () => {
      return this.cookies.get(SESSIONPATH)
    },
    set: (t: string) => {
      return this.cookies.set(SESSIONPATH, t);
    }
  }

  isOwner(restaurant: string) {
    for(let i of this.userInfo.restaurants) {
      if(i === restaurant) {
        return true;
      }
    }
    return false;
  }
  create(go?: { url: string, queryParams?: any }) {
    this.last = go;
    this.router.navigate(["user-create"], { replaceUrl: true });
  }
  async login(reroute: boolean, go?: { url: string, queryParams?: any }) {
    if(go) {
      this.last = go;
    }
    if(this.userInfo) {
      return true;
    }
    const id = this.cookies.get("CTRABAUSERID");
    if(!id) {
      if(reroute) {
        await this.router.navigate(["login"], { replaceUrl: true });
      }
      return false;
    }
    const result = await this.http.patch<User>(`${environment.url}/user/login/saved`, { _id: id }).toPromise();
    if(result) {
      this.userInfo = result;
      return true;
    }
    if(reroute) {
      await this.router.navigate(["login"], { replaceUrl: true });
    }
    return false;
  }
  loginFirst(data: LoginData) {
    return this.http.patch<User>(`${environment.url}/user/login`, data).toPromise();
  }
  logout() {
    this.userInfo = null;
    this.cookies.delete("CTRABAUSERID");
  }


  confirm(t: "restaurant" | "remove", r?: string) {
    this.router.navigate(["confirm"], { replaceUrl: true });
    this.confirmType = t;
    this.type = r;
  }

  
}
