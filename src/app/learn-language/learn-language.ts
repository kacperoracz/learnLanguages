import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SpreadsheetFacade, Word } from '../services/spreadsheet.facade';
import { AppStateService } from '../services/app-state.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-learn-language',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './learn-language.html',
  styleUrls: ['./learn-language.scss']
})
export class LearnLanguage implements OnInit {
  language = '';

  allWords: Word[] = [];
  dueWords: Word[] = [];

  currentWord: Word | null = null;
  currentRowIndex = -1;

  showSourceToTarget = true;

  answer = '';
  answered = false;
  correct = false;
  correctAnswer = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private spreadsheetFacade: SpreadsheetFacade,
    private appState: AppStateService
  ) { }

  ngOnInit() {
    this.language = this.spreadsheetFacade.language.getValue();

    this.spreadsheetFacade.words$.subscribe(allWords => {
      this.allWords = allWords[this.language] || [];
      this.refreshDueWords();
      this.nextWord();
    });
  }

  back() {
    this.router.navigate(['/language-options', this.language]);
  }

  /* ===================== SRS LOGIKA ===================== */

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private isDue(
    lastReview: string | undefined,
    level: number,
    today: string
  ): boolean {
    if (!lastReview) return true;

    const days = Math.pow(level, 2);
    const dueDate = new Date(lastReview);
    dueDate.setDate(dueDate.getDate() + days);

    return dueDate.toISOString().split('T')[0] <= today;
  }

  private refreshDueWords() {
    const today = this.today();

    this.dueWords = this.allWords.filter(word => {
      const dueST = this.isDue(
        word.lastReviewSourceToTarget,
        word.levelSourceToTarget ?? 0,
        today
      );
      const dueTS = this.isDue(
        word.lastReviewTargetToSource,
        word.levelTargetToSource ?? 0,
        today
      );

      return dueST || dueTS;
    });
  }

  /* ===================== NAWIGACJA ===================== */

  nextWord() {
    this.answer = '';
    this.answered = false;
    this.correct = false;

    if (!this.dueWords.length) {
      this.currentWord = null;
      return;
    }

    // 🔒 ochrona przed losowaniem tego samego słowa
    let next: Word;
    do {
      next = this.dueWords[Math.floor(Math.random() * this.dueWords.length)];
    } while (this.dueWords.length > 1 && next === this.currentWord);

    this.currentWord = next;
    this.currentRowIndex = this.allWords.indexOf(this.currentWord);

    const today = this.today();

    const dueST = this.isDue(
      this.currentWord.lastReviewSourceToTarget,
      this.currentWord.levelSourceToTarget ?? 0,
      today
    );

    const dueTS = this.isDue(
      this.currentWord.lastReviewTargetToSource,
      this.currentWord.levelTargetToSource ?? 0,
      today
    );

    // wybór kierunku
    if (dueST && dueTS) {
      this.showSourceToTarget = Math.random() >= 0.5;
    } else {
      this.showSourceToTarget = dueST;
    }

    this.correctAnswer = this.showSourceToTarget
      ? this.currentWord.target
      : this.currentWord.source;
  }

  /* ===================== SPRAWDZANIE ===================== */

  async checkAnswer() {
    if (!this.currentWord) return;

    const isCorrect =
      this.answer.trim().toLowerCase() ===
      this.correctAnswer.trim().toLowerCase();

    this.correct = isCorrect;
    this.answered = true;

    if (this.showSourceToTarget) {
      this.currentWord.levelSourceToTarget = isCorrect
        ? (this.currentWord.levelSourceToTarget ?? 0) + 1
        : Math.floor((this.currentWord.levelSourceToTarget ?? 0) / 2);

      if (isCorrect) {
        this.currentWord.lastReviewSourceToTarget = this.today();
      }
    } else {
      this.currentWord.levelTargetToSource = isCorrect
        ? (this.currentWord.levelTargetToSource ?? 0) + 1
        : Math.floor((this.currentWord.levelTargetToSource ?? 0) / 2);

      if (isCorrect) {
        this.currentWord.lastReviewTargetToSource = this.today();
      }
    }

    const spreadsheetId = this.appState.spreadsheetId$.getValue();
    if (spreadsheetId) {
      await this.spreadsheetFacade.updateWord(
        spreadsheetId,
        this.language,
        this.currentWord,
        this.currentRowIndex
      );
    }

    // 🔄 odświeżenie listy słów do nauki
    this.refreshDueWords();

    // ✅ jeśli to słowo już NIE jest due → przejdź dalej automatycznie
    if (!this.dueWords.includes(this.currentWord)) {
      this.nextWord();
    }
  }
}
