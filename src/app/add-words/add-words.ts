import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpreadsheetFacade, Word } from '../services/spreadsheet.facade';
import { AppStateService } from '../services/app-state.service';

interface WordSection {
  original: string;
  translation: string;
}

@Component({
  selector: 'app-add-words',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-words.html',
})
export class AddWords {
  sections = signal<WordSection[]>([]);

  constructor(
    private router: Router,
    private spreadsheetFacade: SpreadsheetFacade,
    private appState: AppStateService
  ) { }

  addSection() {
    this.sections.update(list => [
      ...list,
      { original: '', translation: '' }
    ]);
  }

  removeSection(index: number) {
    this.sections.update(list => list.filter((_, i) => i !== index));
  }

  async confirm() {
    const spreadsheetId = this.appState.spreadsheetId$.getValue();
    if (!spreadsheetId) {
      alert('Brak aktywnego arkusza!');
      return;
    }

    const lang = this.spreadsheetFacade.language.getValue();

    // przygotowanie danych do wysłania (zgodne z aktualnym modelem Word)
    const words: Word[] = this.sections().map(s => ({
      source: s.original,
      target: s.translation,
      levelSourceToTarget: 0,
      lastReviewSourceToTarget: '',
      levelTargetToSource: 0,
      lastReviewTargetToSource: ''
    }));

    if (!words.length) {
      alert('Nie dodano żadnych słówek!');
      return;
    }

    // dodanie wszystkich słówek naraz
    await this.spreadsheetFacade.addWords(spreadsheetId, lang, words);

    alert('Dodano ' + words.length + ' słówek!');
    this.sections.set([]);
  }

  back() {
    this.router.navigate(['/language-options', 'Polski']);
  }
}
