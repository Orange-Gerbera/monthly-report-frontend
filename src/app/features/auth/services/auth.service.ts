import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { LoginRequest } from '../models/login-request.dto';
import { LoginResponse } from '../models/login-response.dto';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_BASE = `${environment.apiBaseUrl}/auth`;

  private currentUser$ = new BehaviorSubject<LoginResponse | null>(null);
  private currentUser: LoginResponse | null = null;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_BASE}/login`, credentials, {
        withCredentials: true,
      })
     .pipe(
      tap((res) => {
        this.currentUser = res;
        this.currentUser$.next(res);

        // awaitしない
        this.registerPush();
      })
    );
  }

  private async registerPush() {
    console.log("🔥 Push開始");

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log("SW OK");

      const readyRegistration = await navigator.serviceWorker.ready;


      const permission = await Notification.requestPermission();
      console.log("permission:", permission);

      if (permission !== 'granted') return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array('BMwoKvAGRLn8MM3vaJq6t0Znt51pKk5cXlvkAoM_eiED8oojhl3YEURkbLT-BVIqB8K1MNN5LeczNOtDTH55bRg')
      });

      console.log("subscription:", subscription);

      await firstValueFrom(
        this.http.post('/api/push/register', subscription, {
          withCredentials: true,
        })
      );

      console.log("登録完了");

    } catch (e) {
      console.error("Push登録失敗", e);
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  fetchMe(): Observable<LoginResponse> {
    return this.http
      .get<LoginResponse>(`${this.API_BASE}/me`, { withCredentials: true })
      .pipe(
        tap((user) => {
          this.currentUser = user;
          this.currentUser$.next(user);
        }),
        catchError(() => {
          this.currentUser = null;
          return of(null as any);
        })
      );
  }

  logout(): Observable<any> {
    this.currentUser = null;
    return this.http.post(
      `${this.API_BASE}/logout`,
      {},
      {
        withCredentials: true,
        responseType: 'text',
      }
    );
  }

  changePassword(password: string): Observable<any> {
    return this.http.post(
      `${this.API_BASE}/password/change`,
      { password },
      { withCredentials: true }
    );
  }

  getCurrentUser$() {
    return this.currentUser$.asObservable();
}

  getCurrentUser(): LoginResponse | null {
    return this.currentUser$.value;
  }

  refreshCurrentUser(): void {
    this.fetchMe().subscribe();
  }

  isLoggedIn(): Observable<boolean> {
    return this.http.get(`${this.API_BASE}/me`, { withCredentials: true }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  isAdmin(): boolean {
    return (
      this.currentUser?.role === 'ADMIN' ||
      this.currentUser?.role === 'SYSTEM_ADMIN' ||
      this.currentUser?.role === '管理者' ||
      this.currentUser?.role === 'システム管理者'
    );
  }

  isSystemAdmin(): boolean {
    return this.currentUser?.role === 'SYSTEM_ADMIN';
  }
}
