import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private main: MainService,
    private router: Router
  ) {

  }

  async canActivate(): Promise<boolean | UrlTree> {
    if(await this.main.login(true)) {
      return true;
    }
    return this.router.navigate(['login']);
  }
  
}
