import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpreadsheetFacade } from '../services/spreadsheet.facade';
import { Observable } from 'rxjs';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-language-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-list.html',
  styleUrls: ['./language-list.scss']
})
export class LanguageListComponent {
  // obserwujemy języki z Facade
  languages$: Observable<string[]>;

  constructor(
    private router: Router,
    private spreadsheetFacade: SpreadsheetFacade,
    private appState: AppStateService
  ) {
    this.languages$ = this.spreadsheetFacade.languages$;
  }

  addLanguage() {
    this.router.navigate(['/add-language']);
  }

  async selectLanguage(lang: string) {
    const spreadsheetId = this.appState.spreadsheetId$.getValue() ?? "";
    await this.spreadsheetFacade.loadWords(spreadsheetId, lang);
    this.spreadsheetFacade.language.next(lang);
    this.router.navigate(['/language-options', lang]);
  }
}
