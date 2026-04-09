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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  ReportUpsertRequest,
  ReportDto,
  ReportListResponse,
  ReportResponse,
} from '../models/report.dto';
import { environment } from '../../../../environments/environment';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly API_URL = `${environment.apiBaseUrl}/reports`;
  private reportCache: ReportDto[] = [];

  constructor(private http: HttpClient) {}

  getReports(params?: { scopeDeptId?: number; mine?: boolean }): Observable<ReportListResponse> {

    let queryParams: any = {};

    if (params?.scopeDeptId !== undefined) {
      queryParams.scopeDeptId = params.scopeDeptId;
    }

    if (params?.mine !== undefined) {
      queryParams.mine = params.mine;
    }

    return this.http.get<ReportListResponse>(this.API_URL, {
      params: queryParams,
      withCredentials: true,
    });
  }

  createReport(report: ReportUpsertRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.API_URL, report, {
      withCredentials: true,
    });
  }

  setCache(reports: ReportDto[]): void {
    this.reportCache = reports;
  }

  getCachedReportById(id: string): ReportDto | undefined {
    return this.reportCache.find((r) => r.id === Number(id));
  }

  getReportById(id: string, forceReload = false): Observable<ReportResponse> {
    const cached = this.getCachedReportById(id);
    if (!forceReload && cached) {
      return of({ report: cached });
    }

    return this.http.get<ReportResponse>(`${this.API_URL}/${id}`, {
      withCredentials: true,
    });
  }

  updateReport(id: string, report: ReportDto): Observable<ReportResponse> {
    return this.http.put<ReportResponse>(`${this.API_URL}/${id}`, report, {
      withCredentials: true,
    });
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, {
      withCredentials: true,
    });
  }

  approveReport(id: number, approve: boolean | null): Observable<ReportResponse> {

    let url = `${this.API_URL}/${id}/approval`;

    if (approve !== null) {
      url += `?approve=${approve}`;
    }

    return this.http.patch<ReportResponse>(
      url,
      null,
      { withCredentials: true }
    );
  }

  submitReport(id: number, submit: boolean): Observable<ReportResponse> {

    return this.http.patch<ReportResponse>(
      `${this.API_URL}/${id}/submit?submit=${submit}`,
      null,
      { withCredentials: true }
    );

  }

  receiveReport(id: number, receive: boolean | null) {

    let url = `${this.API_URL}/${id}/receive`;

    if (receive !== null) {
      url += `?receive=${receive}`;
    }

    return this.http.patch(
      url,
      null,
      { withCredentials: true }
    );
  }

  commentOnReport(id: number, comment: string): Observable<void> {
    return this.http.patch<void>(
      `${this.API_URL}/${id}/comment`,
      { comment },
      { withCredentials: true }
    );
  }

  // 直近の報告書を取得する
  getLatestReport(): Observable<ReportDto> {
    return this.http.get<ReportDto>(`${this.API_URL}/latest`, {
      withCredentials: true,
    });
  }

  // 報告書をExcelとしてダウンロード
  downloadReportExcel(reportId: number): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.API_URL}/export`, null, {
      params: { reportId },
      responseType: 'blob',
      observe: 'response', // ヘッダー取得のために必要
      withCredentials: true,
    });
  }

  // 年月を指定して報告書を取得
  getReportByYearMonth(
    baseReportId: number,
    yearMonth: string
  ): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(
      `${this.API_URL}/${baseReportId}/month/${yearMonth}`,
      {
        withCredentials: true,
      }
    );
  }

  getReportByEmployeeAndMonth(
    code: string,
    yearMonth: string
  ): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(
      `${this.API_URL}/employee/${code}/month/${yearMonth}`,
      {
        withCredentials: true,
      }
    );
  }

  getDueDate(yearMonth: string, departmentId: number): Observable<string> {
    return this.http.get<string>(
      `${environment.apiBaseUrl}/report-due-dates/due-date?yearMonth=${yearMonth}&departmentId=${departmentId}`,
      { withCredentials: true }
    );
  }
}
