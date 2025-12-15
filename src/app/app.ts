import { AfterViewInit, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SpreadsheetFacade } from './services/spreadsheet.facade';
import { AppStateService } from './services/app-state.service';
import { Observable, firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
  isLoggedIn$!: Observable<boolean>;
  spreadsheetId$!: Observable<string | null>;
  loading$!: Observable<boolean>;

  protected readonly title = signal('slowka');

  constructor(
    private authService: AuthService,
    private appState: AppStateService,
    private spreadsheetFacade: SpreadsheetFacade
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.spreadsheetId$ = this.appState.spreadsheetId$;
    this.loading$ = this.appState.loading$;
  }

  ngAfterViewInit(): void {
    // 1️⃣ inicjalizacja Google Identity Services
    this.authService.init();

    this.authService.login();

    // 2️⃣ subskrybujemy zmiany stanu logowania
    this.isLoggedIn$.subscribe(async loggedIn => {
      if (!loggedIn) return;

      // 3️⃣ włączamy loading
      this.appState.loading$.next(true);

      // 4️⃣ tworzymy / pobieramy spreadsheet
      const spreadsheetId = await this.spreadsheetFacade.initUserSpreadsheet();

      // 5️⃣ zapisujemy ID w stanie
      this.appState.spreadsheetId$.next(spreadsheetId);

      // 6️⃣ kończymy loading
      this.appState.loading$.next(false);

      // od razu pobieramy zakładki
      await this.spreadsheetFacade.getLanguages(spreadsheetId);
    });
  }
}
