import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { SheetsService } from './sheets.service';
import { DriveService } from './drive.service';
import { AppStateService } from './app-state.service';
import { AuthService } from './auth.service';

export interface Word {
  source: string;
  target: string;
  levelSourceToTarget?: number;
  lastReviewSourceToTarget?: string;
  levelTargetToSource?: number;
  lastReviewTargetToSource?: string;
  rowIndex?: number;
}

@Injectable({ providedIn: 'root' })
export class SpreadsheetFacade {
  private readonly SPREADSHEET_NAME = 'SLOWKA';

  // stan przechowywany w pamięci
  private languagesSubject = new BehaviorSubject<string[]>([]);
  public wordsSubject = new BehaviorSubject<{ [lang: string]: Word[] }>({});
  public language = new BehaviorSubject<string>("");

  // obserwowalne do komponentów
  languages$ = this.languagesSubject.asObservable();
  words$ = this.wordsSubject.asObservable();

  constructor(
    private sheetsApi: SheetsService,
    private driveApi: DriveService,
    private appState: AppStateService,
    private auth: AuthService
  ) {

  }

  async initUserSpreadsheet(): Promise<string> {
    const existing = await this.driveApi.findSpreadsheetByName(this.SPREADSHEET_NAME);
    if (existing) return existing.id;

    const spreadsheetId = await this.sheetsApi.getOrCreateSpreadsheet(this.SPREADSHEET_NAME);

    return spreadsheetId;
  }

  async getLanguages(spreadsheetId: string): Promise<string[]> {
    const tabs = await this.sheetsApi.getSheetTabs(spreadsheetId);
    const langs = tabs.map(t => t.title);
    this.languagesSubject.next(langs);
    return langs;
  }

  async loadWords(spreadsheetId: string, lang: string): Promise<Word[]> {
    const values = await this.sheetsApi.getValues(spreadsheetId, `${lang}!A:F`);

    const words = values.map((row, i) => ({
      source: row[0],
      target: row[1],
      levelSourceToTarget: Number(row[2] ?? 0),
      lastReviewSourceToTarget: row[3] || undefined,
      levelTargetToSource: Number(row[4] ?? 0),
      lastReviewTargetToSource: row[5] || undefined,
      rowIndex: i
    }));

    const current = this.wordsSubject.getValue();
    this.wordsSubject.next({ ...current, [lang]: words });

    return words;
  }

  async addWords(spreadsheetId: string, lang: string, words: Word[]): Promise<void> {
    const values = words.map(w => [
      w.source,
      w.target,
      w.levelSourceToTarget ?? 0,
      w.lastReviewSourceToTarget ?? '',
      w.levelTargetToSource ?? 0,
      w.lastReviewTargetToSource ?? ''
    ]);

    await this.sheetsApi.appendValues(spreadsheetId, `${lang}!A:F`, values);

    const current = this.wordsSubject.getValue();
    const updatedLangWords = [...(current[lang] || []), ...words];
    this.wordsSubject.next({ ...current, [lang]: updatedLangWords });
  }

  async ensureLanguage(spreadsheetId: string, lang: string): Promise<void> {
    const langs = await this.getLanguages(spreadsheetId);
    if (!langs.includes(lang)) {
      await this.sheetsApi.addSheet(spreadsheetId, lang);
      const updatedLangs = await this.getLanguages(spreadsheetId);
      this.languagesSubject.next(updatedLangs);
    }
  }

  async updateWord(
    spreadsheetId: string,
    lang: string,
    word: Word,
    rowIndex: number
  ): Promise<void> {
    await this.sheetsApi.updateWord(
      spreadsheetId,
      lang,
      rowIndex,
      word
    );

    // aktualizacja cache w pamięci
    const current = this.wordsSubject.getValue();
    const updated = [...(current[lang] || [])];
    updated[rowIndex] = { ...word };

    this.wordsSubject.next({
      ...current,
      [lang]: updated
    });
  }
}
