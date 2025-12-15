import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SpreadsheetFacade, Word } from '../services/spreadsheet.facade';
import { AppStateService } from '../services/app-state.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './summary.html',
})
export class Summary implements OnInit {
  language = '';
  words = signal<Word[]>([]);
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spreadsheetFacade: SpreadsheetFacade,
    private appState: AppStateService
  ) {}

  async ngOnInit() {
    this.language = this.spreadsheetFacade.language.getValue();
    const spreadsheetId = this.appState.spreadsheetId$.getValue();

    if (!spreadsheetId || !this.language) {
      alert('Brak arkusza lub języka!');
      this.router.navigate(['/']);
      return;
    }

    // subskrybujemy słówka z facade
    this.spreadsheetFacade.words$.subscribe(allWords => {
      const langWords = allWords[this.language] || [];
      this.words.set(langWords);
    });
  }

  back() {
    this.router.navigate(['/language-options', this.language]);
  }
}
