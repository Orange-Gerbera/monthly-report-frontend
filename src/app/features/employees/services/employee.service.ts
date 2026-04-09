/**
 * Project: Orange Gerbera
 * -----------------------------------------------------------------------------
 * Copyright (c) 2024-2026 Tai Naoyuki & Kagoshima Takuho.
 * All rights reserved.
 * 
 * This software and any associated documentation are the intellectual property
 * of Tai Naoyuki & Kagoshima Takuho.
 * 
 * Unauthorized copying, use, or distribution of this software,
 * in whole or in part, is strictly prohibited.
 * -----------------------------------------------------------------------------
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { EmployeeDto } from '../models/employee.dto';
import { environment } from '../../../../environments/environment'; // 相対パスに修正
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly API_URL = `${environment.apiBaseUrl}/employees`;
  private employeeCache = new Map<string, EmployeeDto>();

  constructor(private http: HttpClient) {}

  getAll(): Observable<EmployeeDto[]> {
    return this.http
      .get<{
        total: number;
        page: number;
        size: number;
        data: EmployeeDto[];
      }>(this.API_URL, {
        withCredentials: true,
      })
      .pipe(
        map((response) =>
          response.data.map(e => this.normalizeEmployee(e))
        ),
        tap((employees) => this.setCache(employees))
      );
  }

  setCache(employees: EmployeeDto[]): void {
    employees.forEach(e => {
      this.employeeCache.set(String(e.code), e);
    });
  }

  private normalizeEmployee(e: EmployeeDto): EmployeeDto {
    return {
      ...e,
      code: String(e.code),
      primaryDepartmentId: e.primaryDepartmentId != null
        ? Number(e.primaryDepartmentId)
        : undefined
    };
  }

  getCachedEmployeeByCode(code: string): EmployeeDto | undefined {
    return this.employeeCache.get(code);
  }

  getEmployeeByIdWithFallback(code: string): Observable<EmployeeDto> {
    const cached = this.getCachedEmployeeByCode(code);

    return cached
      ? of(cached)
      : this.http.get<EmployeeDto>(`${this.API_URL}/${code}`, {
          withCredentials: true,
        }).pipe(
          map(e => this.normalizeEmployee(e)) // ★追加
        );
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

  issuePasswordResetAdmin(code: string, email: string): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/password/admin/request`,
      {
        code,
        email
      },
      {
        withCredentials: true
      }
    );
  }

  getEmployees(params: {
    parentDeptId?: number;
    keyword?: string;
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
  }) {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20))
      .set('sort', params.sort ?? 'code')
      .set('direction', params.direction ?? 'asc');

    if (params.parentDeptId != null) {
      httpParams = httpParams.set('parentDeptId', String(params.parentDeptId));
    }

    if (params.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }

    return this.http.get<{
      total: number;
      page: number;
      size: number;
      data: EmployeeDto[];
    }>(this.API_URL, {
      params: httpParams,
      withCredentials: true,
    }).pipe(
      map(res => ({
        ...res,
        data: res.data.map(e => this.normalizeEmployee(e))
      }))
    );
  }
}
