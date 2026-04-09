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
import { BehaviorSubject } from 'rxjs';
import { ReportService } from '../services/report.service';
import { ContextService } from '../../../shared/services/context.service';
import { ReportDto } from '../models/report.dto';

@Injectable({
  providedIn: 'root'
})
export class ReportFacade {

  private reportsSubject = new BehaviorSubject<ReportDto[]>([]);
  reports$ = this.reportsSubject.asObservable();

  constructor(
    private reportService: ReportService
  ) {}

  loadReports(deptId: number) {
    this.reportService.getReports({ scopeDeptId: deptId })
      .subscribe({
        next: res => {
          this.reportsSubject.next(res.reportList);
        },
        error: err => {
          console.error('loadReports error', err);
          this.reportsSubject.next([]);
        }
      });
  }

  downloadReportExcel(reportId: number) {
    return this.reportService.downloadReportExcel(reportId);
  }

  getReportMonths(reports: ReportDto[]): string[] {
    return [...new Set(reports.map(r => r.reportMonth))]
      .sort()
      .reverse();
  }
}