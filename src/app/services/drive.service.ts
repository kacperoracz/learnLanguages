import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DriveService {
  private baseUrl = 'https://www.googleapis.com/drive/v3/files';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private get headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.accessToken}`
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
        `${this.baseUrl}?q=${encodeURIComponent(q)}&fields=files(id,name)`,
        { headers: this.headers }
      )
    );

    return res.files?.[0] ?? null;
  }

  async createFolder(name: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<any>(
        this.baseUrl,
        {
          name,
          mimeType: 'application/vnd.google-apps.folder'
        },
        { headers: this.headers }
      )
    );

    return res.id;
  }

  async moveFile(fileId: string, folderId: string): Promise<void> {
    const file = await firstValueFrom(
      this.http.get<any>(
        `${this.baseUrl}/${fileId}?fields=parents`,
        { headers: this.headers }
      )
    );

    const previousParents = file.parents?.join(',') ?? '';

    await firstValueFrom(
      this.http.patch(
        `${this.baseUrl}/${fileId}?addParents=${folderId}&removeParents=${previousParents}`,
        {},
        { headers: this.headers }
      )
    );
  }
}
