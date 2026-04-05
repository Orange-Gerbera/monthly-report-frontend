import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { LoginRequest } from '../models/login-request.dto';
import { LoginResponse } from '../models/login-response.dto';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_BASE = `${environment.apiBaseUrl}/auth`;

  private currentUser$ = new BehaviorSubject<LoginResponse | null>(null);

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_BASE}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(tap((res) => {
        this.currentUser$.next(res);
      }
    ));
  }

  fetchMe(): Observable<LoginResponse> {
    return this.http
      .get<LoginResponse>(`${this.API_BASE}/me`, { withCredentials: true })
      .pipe(
        tap((user) => {
          this.currentUser$.next(user);
        }),
        catchError(() => {
          this.currentUser$.next(null);
          return of(null as any);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${this.API_BASE}/logout`,
      {},
      {
        withCredentials: true,
        responseType: 'text',
      }
    ).pipe(
      tap(() => this.currentUser$.next(null))
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
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  isAdmin(): boolean {
    const user = this.currentUser$.value;
    return (
      user?.role === 'ADMIN' ||
      user?.role === 'SYSTEM_ADMIN' ||
      user?.role === '管理者' ||
      user?.role === 'システム管理者'
    );
  }

  isSystemAdmin(): boolean {
    return this.currentUser$.value?.role === 'SYSTEM_ADMIN';
  }
}
