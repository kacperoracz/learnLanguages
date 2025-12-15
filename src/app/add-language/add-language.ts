import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpreadsheetFacade } from '../services/spreadsheet.facade';
import { firstValueFrom } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-language',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-language.html',
  styleUrls: ['./add-language.scss']
})
export class AddLanguage implements OnInit {
  newLanguage = '';

  constructor(
    private router: Router,
    private spreadsheetFacade: SpreadsheetFacade,
    private appState: AppStateService
  ) { }

  ngOnInit() { }

  async addLanguage() {
    const lang = this.newLanguage.trim();
    if (!lang) {
      alert('Wpisz nazwę języka!');
      return;
    }

    // Pobranie aktualnego spreadsheetId
    const spreadsheetId = await firstValueFrom(this.appState.spreadsheetId$);
    if (!spreadsheetId) {
      alert('Nie znaleziono arkusza użytkownika!');
      return;
    }

    // Dodanie zakładki w arkuszu (jeśli jeszcze nie istnieje)
    await this.spreadsheetFacade.ensureLanguage(spreadsheetId, lang);

    // Pobranie aktualnej listy języków i odświeżenie stanu w pamięci
    const langs = await this.spreadsheetFacade.getLanguages(spreadsheetId);
    // languages$ w SpreadsheetFacade już będzie odświeżone dzięki ensureLanguage/getLanguages

    console.log('Dodano język:', lang);

    // Przekierowanie z powrotem na listę języków
    this.router.navigate(['/']);
  }

  back() {
    this.router.navigate(['/']);
  }
}
