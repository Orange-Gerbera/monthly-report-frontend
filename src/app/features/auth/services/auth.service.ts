import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { LoginRequest } from '../models/login-request.dto';
import { LoginResponse } from '../models/login-response.dto';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_BASE = `${environment.apiBaseUrl}/auth`;

  private currentUser: LoginResponse | null = null;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_BASE}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(tap((res) => (this.currentUser = res)));
  }

  fetchMe(): Observable<LoginResponse> {
    return this.http
      .get<LoginResponse>(`${this.API_BASE}/me`, { withCredentials: true })
      .pipe(
        tap((user) => (this.currentUser = user)),
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

  getCurrentUser(): LoginResponse | null {
    return this.currentUser;
  }

  isLoggedIn(): Observable<boolean> {
    return this.http.get(`${this.API_BASE}/me`, { withCredentials: true }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  isAdmin(): boolean {
    return (
      this.currentUser?.role === '管理者' || this.currentUser?.role === 'ADMIN'
    );
  }
}
