import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  readonly spreadsheetId$ = new BehaviorSubject<string | null>(null);
  readonly loading$ = new BehaviorSubject<boolean>(false);
}
