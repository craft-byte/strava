import { Injectable } from '@angular/core';
import { User } from 'src/models/user';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterService } from './router.service';



@Injectable({
    providedIn: 'root'
})
export class MainService {

    user: User;
    last: { url: string, queryParams?: any };


    confirmType: "remove" | "restaurant";
    type: string;

    info = {
        staffLogin: null,
        restaurantId: null
    }

    constructor(
        private router: RouterService,
        private http: HttpClient
    ) { };


    async login(data: { email: string; password: string; }) {
        const result = await this.http.post<{ success: boolean; redirectTo: string; token: string; expires: number }>(environment.url + "/user/login", data, { headers: new HttpHeaders({ "Skip-Interceptor": "true" }) }).toPromise();

        if (result.success) {
            this.setUserInfo(result.token, result.expires);
        }

        return { success: result.success, redirectTo: result.redirectTo };
    };


    async updateToken() {
        try {
            const result = await this.http.get<{ token: string; expires: number; user: User; }>(environment.url + "/user/update-token").toPromise();
    
            if(result.user) {
                this.user = result.user;
            }
            if(result.token) {
                this.setUserInfo(result.token, result.expires);
            }

        } catch (e) {
            if(e.status == 401) {
                this.router.go(["user/login"]);
            }
        }
    }

    async getUserData() {
        try {
            const result = await this.http.get<{ user: User; }>(environment.url + "/user/data").toPromise();

            if(result.user) {
                this.user = result.user;
            }
            
        } catch (e) {
            if(e.status == 401) {
                this.router.go(["user/login"]);
            }
        }
    }


    setUserInfo(token: string, exp: number) {
        localStorage.setItem('token', token);
        localStorage.setItem('exp', exp.toString());
    }
    removeUserInfo() {
        localStorage.removeItem("token");
        localStorage.removeItem("exp");
    }

}
