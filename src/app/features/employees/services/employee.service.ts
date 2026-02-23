import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { EmployeeDto } from '../models/employee.dto';
import { environment } from '../../../../environments/environment'; // 相対パスに修正

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly API_URL = `${environment.apiBaseUrl}/employees`;
  private employeeCache: EmployeeDto[] = [];

  constructor(private http: HttpClient) {}

  getAll(): Observable<EmployeeDto[]> {
    return this.http
      .get<{ listSize: number; employeeList: EmployeeDto[] }>(this.API_URL, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.employeeList),
        tap((employees) => this.setCache(employees))
      );
  }

  setCache(employees: EmployeeDto[]): void {
    this.employeeCache = employees;
  }

  getCachedEmployeeByCode(code: string): EmployeeDto | undefined {
    return this.employeeCache.find((e) => String(e.code) === code);
  }

  getEmployeeByIdWithFallback(code: string): Observable<EmployeeDto> {
    const cached = this.getCachedEmployeeByCode(code);
    return cached
      ? of(cached)
      : this.http.get<EmployeeDto>(`${this.API_URL}/${code}`, {
          withCredentials: true,
        });
  }

  update(code: string, request: Partial<EmployeeDto>): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.API_URL}/${code}`, request, {
      withCredentials: true,
    });
  }

  getByCode(code: string): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.API_URL}/${code}`, {
      withCredentials: true,
    });
  }

  delete(code: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${code}`, {
      withCredentials: true,
    });
  }

  getCurrentUser(): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.API_URL}/me`, {
      withCredentials: true,
    });
  }
}
