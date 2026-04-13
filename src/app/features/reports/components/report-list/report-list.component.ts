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

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ReportDto } from '../../models/report.dto';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { SelectComponent } from '../../../../shared/select/select.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { from, startWith } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';
import { ExcelDownloadService } from '../../services/excel-download.service';
import { ReportFacade } from '../../facades/report.facade';
import { ContextService } from '../../../../shared/services/context.service';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonComponent,
    SelectComponent,
    IconComponent,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss'],
})
export class ReportListComponent implements OnInit, OnDestroy, AfterViewInit {

  reports: ReportDto[] = [];
  reportMonthList: string[] = [];
  selectedMonth: string = '';
  loading: boolean = true;

  reportIds: number[] = [];
  selectedReports: Set<number> = new Set();

  displayedColumns: string[] = [
    'select',
    'employeeName',
    'reportMonth',
    'dueDate',
    'submittedAt',
    'departmentName',
    'status',
    'comment',
    'actions',
  ];

  dataSource = new MatTableDataSource<ReportDto>([]);
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private currentDeptId?: number;
  private initializedFromUrl = false;

  constructor(
    private facade: ReportFacade,
    private excelDownloadService: ExcelDownloadService,
    private route: ActivatedRoute,
    private router: Router,
    private context: ContextService 
  ) {
    this.dataSource.sortingDataAccessor = (item, property) => {
      const value = (item as any)[property];
      return typeof value === 'string' ? value : value ?? '';
    };
  }

  ngOnInit(): void {

    // ⭐ Context → Facade
    this.context.selectedDeptId$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged()
      )
      .subscribe(deptId => {
        this.currentDeptId = deptId ?? undefined;

        if (this.currentDeptId != null) {
          this.facade.loadReports(this.currentDeptId);
        }
      });

    // URL
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const monthParam = params.get('selectedMonth');
        if (monthParam) {
          this.selectedMonth = monthParam;
          this.initializedFromUrl = true;
        }
      });

    // Facade
    this.facade.reports$
      .pipe(takeUntil(this.destroy$))
      .subscribe(reports => {
        this.reports = reports;

        this.reportMonthList = this.facade.getReportMonths(reports);

        if (!this.initializedFromUrl) {
          if (
            !this.selectedMonth ||
            !this.reportMonthList.includes(this.selectedMonth)
          ) {
            this.selectedMonth = this.reportMonthList[0];
          }
        }

        this.updateTableData();
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.sortData = (data: ReportDto[], sort: MatSort) => {
      const active = sort.active;
      const direction = sort.direction;
      if (!active || direction === '') return data;

      const sorted = data.slice().sort((a, b) => {
        let valueA = (a as any)[active];
        let valueB = (b as any)[active];

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB, 'ja');
        }

        valueA = valueA ?? 0;
        valueB = valueB ?? 0;
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      });

      return direction === 'asc' ? sorted : sorted.reverse();
    };

    this.dataSource.sort = this.sort;
  }

  updateTableData(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { selectedMonth: this.selectedMonth },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.dataSource.data = this.filteredReports;

    this.reportIds = this.filteredReports
      .map(r => r.id)
      .filter((id): id is number => id != null);

    this.selectedReports = new Set<number>();
  }

  get filteredReports(): ReportDto[] {
    return this.reports.filter(r => r.reportMonth === this.selectedMonth);
  }

  formatDate(input: string, mode: 'month' | 'date' | 'datetime' | 'datetimeWithDay'): string {
    if (!input) return '';
    const date = new Date(input);

    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    const hh = ('0' + date.getHours()).slice(-2);
    const mm = ('0' + date.getMinutes()).slice(-2);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

    switch (mode) {
      case 'month': return `${y}年${m}月`;
      case 'date': return `${m}/${d}`;
      case 'datetime': return `${y}/${m}/${d} ${hh}:${mm}`;
      case 'datetimeWithDay':
        return `${m}/${d}(${dayOfWeek}) ${hh}:${mm}`;
      default: return '';
    }
  }

  isSelected(report: ReportDto): boolean {
    return this.selectedReports.has(report.id);
  }

  toggleSelection(report: ReportDto): void {
    if (this.isSelected(report)) {
      this.selectedReports.delete(report.id);
    } else {
      this.selectedReports.add(report.id);
    }
  }

  toggleAllSelection(checked: boolean): void {
    if (checked) {
      this.filteredReports
        .filter(r => r.receivedFlg === true)
        .forEach(r => this.selectedReports.add(r.id));
    } else {
      this.selectedReports.clear();
    }
  }

  isAllSelected(): boolean {
    const selectable = this.filteredReports.filter(r => r.receivedFlg === true);
    return selectable.length > 0 &&
      selectable.every(r => this.selectedReports.has(r.id));
  }

  isSomeSelected(): boolean {
    const selectable = this.filteredReports.filter(r => r.receivedFlg === true);
    const selectedCount = selectable.filter(r => this.selectedReports.has(r.id)).length;
    return selectedCount > 0 && selectedCount < selectable.length;
  }

  exportSelectedReports(): void {
    if (this.selectedReports.size === 0) {
      alert('少なくとも1件の報告書を選択してください。');
      return;
    }

    from([...this.selectedReports])
      .pipe(
        concatMap(id =>
          this.facade.downloadReportExcel(id).pipe(
            tap(res =>
              this.excelDownloadService.download(res, `report-${id}.xlsx`)
            )
          )
        )
      )
      .subscribe();
  }

  get routerUrl(): string {
    return this.router.url;
  }
}