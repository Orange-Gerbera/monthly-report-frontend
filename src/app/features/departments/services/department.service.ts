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
import { DepartmentDto } from '../models/department.dto';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment'; // 相対パスに修正

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private baseUrl = `${environment.apiBaseUrl}/departments`;

  constructor(private http: HttpClient) {}

  // 所属一覧取得
  getAll(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(this.baseUrl, {
      withCredentials: true,
    }).pipe(
      map(list => list.map(d => this.normalizeDepartment(d)))
    );
  }

  // 所属追加
  create(department: Partial<DepartmentDto>): Observable<DepartmentDto> {
    return this.http.post<DepartmentDto>(this.baseUrl, department, {
      withCredentials: true,
    });
  }

  // 所属削除
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  updateActive(id: number, active: boolean): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${id}/active`,
      { active },
      { withCredentials: true }
    );
  }

  getById(id: number): Observable<DepartmentDto> {
    return this.http.get<DepartmentDto>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    }).pipe(
      map(d => this.normalizeDepartment(d))
    );
  }

  private normalizeDepartment(d: DepartmentDto): DepartmentDto {
    return {
      ...d,
      id: Number(d.id),
      parentId: d.parentId != null ? Number(d.parentId) : undefined
    };
  }
}
