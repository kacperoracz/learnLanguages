import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';
import { Word } from './spreadsheet.facade';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private get headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  async findSpreadsheetByName(name: string): Promise<{ id: string; name: string } | null> {
    const q = [
      `name='${name}'`,
      `mimeType='application/vnd.google-apps.spreadsheet'`,
      `trashed=false`
    ].join(' and ');

    const res = await firstValueFrom(
      this.http.get<any>(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
        { headers: this.headers }
      )
    );

    return res.files?.[0] ?? null;
  }

  async getOrCreateSpreadsheet(title: string): Promise<string> {
    const existing = await this.findSpreadsheetByName(title);
    if (existing) return existing.id;

    const created = await this.createSpreadsheet(title);
    return created.spreadsheetId;
  }

  async createSpreadsheet(
    title: string,
    firstSheetName = 'Angielski'
  ): Promise<{ spreadsheetId: string }> {
    return firstValueFrom(
      this.http.post<any>(
        this.baseUrl,
        {
          properties: {
            title
          },
          sheets: [
            {
              properties: {
                title: firstSheetName
              }
            }
          ]
        },
        { headers: this.headers }
      )
    );
  }

  async getSheetTabs(spreadsheetId: string): Promise<{ title: string; sheetId: number }[]> {
    const res = await firstValueFrom(
      this.http.get<any>(
        `${this.baseUrl}/${spreadsheetId}?fields=sheets.properties`,
        { headers: this.headers }
      )
    );

    return res.sheets.map((s: any) => ({
      title: s.properties.title,
      sheetId: s.properties.sheetId
    }));
  }

  async getValues(spreadsheetId: string, range: string): Promise<string[][]> {
    const res = await firstValueFrom(
      this.http.get<any>(
        `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        { headers: this.headers }
      )
    );

    return res.values ?? [];
  }

  async appendValues(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        { values },
        { headers: this.headers }
      )
    );
  }

  async updateValues(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${this.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        { values },
        { headers: this.headers }
      )
    );
  }

  async updateWord(
    spreadsheetId: string,
    sheetName: string,
    rowIndex: number,
    word: Word
  ): Promise<void> {
    // ⬇️ BEZ HEADERÓW
    const rowNumber = rowIndex + 1;

    const values = [[
      word.source,
      word.target,
      word.levelSourceToTarget ?? 0,
      word.lastReviewSourceToTarget ?? '',
      word.levelTargetToSource ?? 0,
      word.lastReviewTargetToSource ?? ''
    ]];

    await firstValueFrom(
      this.http.put(
        `${this.baseUrl}/${spreadsheetId}/values/${sheetName}!A${rowNumber}:F${rowNumber}?valueInputOption=USER_ENTERED`,
        { values },
        { headers: this.headers }
      )
    );
  }

  async batchUpdate(spreadsheetId: string, requests: any[]): Promise<void> {
    await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/${spreadsheetId}:batchUpdate`,
        { requests },
        { headers: this.headers }
      )
    );
  }

  async addSheet(spreadsheetId: string, title: string): Promise<void> {
    await this.batchUpdate(spreadsheetId, [
      {
        addSheet: {
          properties: { title }
        }
      }
    ]);
  }
}
