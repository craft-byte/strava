import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  base = environment.url + "/customer";

  restaurantId: string;
  theme: string;




  constructor(
    private http: HttpClient,
  ) { };

  get<T>(queryParams: { [key: string]: string; }, ...path: string[]) {
    return this.http.get<T>(this.base + "/" + path.join("/"), { params: queryParams }).toPromise();
  }
  post<T>(body: any, ...path: string[]) {
    return this.http.post<T>(this.base + "/" + path.join("/"), body).toPromise();
  }
  delete<T>(queryParams: { [key: string]: string; }, ...path: string[]) {
    return this.http.delete<T>(this.base + "/" + path.join("/"), { params: queryParams }).toPromise();
  }
  patch<T>(body: any, ...path: string[]) {
    return this.http.patch<T>(this.base + "/" + path.join("/"), body).toPromise();
  }

  getobs<T>(body: any, ...path: string[]) {
    return this.http.post<T>(this.base + "/" + path.join("/"), body);
  }



}
