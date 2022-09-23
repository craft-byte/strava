import { Injectable } from '@angular/core';
import { User } from 'src/models/user';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';


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
    private router: Router,
    private http: HttpClient
  ) {};

  auth() {
    const token = localStorage.getItem("token");

    if(token) {
        const headers = new HttpHeaders().append("Authorization", token).append("Skip-Interceptor", "true");

        return this.http.get<any>(environment.url + "/user/status", { headers });
    } else {
        return of({ success: false });
    }
  }

  logout() {
    this.userInfo = null;
    this.http.delete(environment.url + "/user/logout").toPromise();
  }

  setUserInfo(token: string) {
    localStorage.setItem('token', token);    
  }
  removeUserInfo() {
    localStorage.removeItem("token");
  }
  


  async login(data: { email: string; password: string; }) {
    const result = await this.http.post<{ success: boolean; redirectTo: string; token: string; expiresAt: string}>(environment.url + "/user/login", data, { headers: new HttpHeaders({ "Skip-Interceptor": "true" }) }).toPromise();

    if(result.success) {
        this.setUserInfo(result.token);           
    }

    return { success: result.success, redirectTo: result.redirectTo };

  };

}
