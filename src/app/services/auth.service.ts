import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AuthService {
  tokenClient: any;
  accessToken: string | null = null;

  readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);

  init() {
    console.log("Google init")
    if (!('google' in window)) {
      console.log('Google Identity Services nie są załadowane')
    }

    this.tokenClient =
      window.google.accounts.oauth2.initTokenClient({
        client_id: '897345298838-lon3m2gaej09v0d03nj57re2gh88e9pm.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (resp) => {
          console.log(resp)
          this.accessToken = resp.access_token;
          this.isLoggedIn$.next(true);
        }
      });
  }

  onLoginSuccess(token: string) {
    this.accessToken = token;
    this.isLoggedIn$.next(true);
  }

  login() {
    if (!this.tokenClient) throw new Error('Token client nie został zainicjalizowany');
    this.tokenClient.requestAccessToken();
  }

  logout() {
    this.accessToken = null;
    this.isLoggedIn$.next(false);
  }
}
