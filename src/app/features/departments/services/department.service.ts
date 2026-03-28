import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DepartmentDto } from '../models/department.dto';
import { Observable } from 'rxjs';
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
    });
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
}
