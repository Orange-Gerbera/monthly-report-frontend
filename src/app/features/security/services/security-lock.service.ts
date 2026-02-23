// src/app/features/security/services/security-lock.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SecurityLockService {
  private apiUrl = '/api/auth';

  constructor(private http: HttpClient) {}

  /**
   * 現在ロックされているIPとユーザーの一覧を取得
   * レスポンス形式: { ipLocks: { "ip": "time" }, userLocks: { "key": "time" } }
   */
  getLocks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/locks`);
  }

  /**
   * アカウントロックを解除する
   */
  unlockUser(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/unlock`, { code });
  }

  /**
   * IPロックを解除する
   */
  unlockIp(ip: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/unlock-ip`, { ip });
  }
}