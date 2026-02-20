import { Component, OnInit } from '@angular/core';
import { ReportDto } from '../../models/report.dto';
import { ReportService } from '../../services/report.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { SelectComponent } from '../../../../shared/select/select.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ViewChild, AfterViewInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { ExcelDownloadService } from '../../services/excel-download.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { from } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';

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
  ],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss'],
})
export class ReportListComponent implements OnInit {
  reports: ReportDto[] = [];
  reportMonthList: string[] = [];
  loading: boolean = true;
  selectedMonth: string = '';
  useLatest = false;
  displayedColumns: string[] = [
    'select',
    'employeeName',
    'reportMonth',
    'dueDate',
    'submittedAt',
    'departmentName',
    'completeFlg',
    'approvalFlg',
    'comment',
    'actions',
  ];
  @ViewChild(MatSort) sort!: MatSort;
  selectedReports: Set<number> = new Set();

  dataSource = new MatTableDataSource<ReportDto>([]);

  constructor(
    private reportService: ReportService,
    private excelDownloadService: ExcelDownloadService,
    private route: ActivatedRoute
  ) {
    this.dataSource.sortingDataAccessor = (item, property) => {
      const value = (item as any)[property];
      return typeof value === 'string' ? value : value ?? '';
    };
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const monthParam = params.get('selectedMonth');

      this.reportService.getReports().subscribe({
        next: (res) => {
          this.reports = res.reportList;

          // 🔽 ここでキャッシュに保存
          this.reportService.setCache(res.reportList);

          // ユニークなreportMonthを抽出して降順にソート
          this.reportMonthList = [
            ...new Set(this.reports.map((r) => r.reportMonth)),
          ]
            .sort()
            .reverse();

          // クエリパラメータが reportMonthList に含まれていれば初期値に使用
          if (monthParam && this.reportMonthList.includes(monthParam)) {
            this.selectedMonth = monthParam;
          } else {
            this.selectedMonth = this.reportMonthList[0]; // 通常通り最新の月を選択
          }

          this.updateTableData();
          this.loading = false; // ローディング完了
        },
        error: (err) => {
          console.error('取得失敗', err);
          this.loading = false; // エラー時もローディング完了
        },
      });
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sortData = (data: ReportDto[], sort: MatSort) => {
      const active = sort.active;
      const direction = sort.direction;
      if (!active || direction === '') {
        return data;
      }

      const sorted = data.slice().sort((a, b) => {
        let valueA = (a as any)[active];
        let valueB = (b as any)[active];

        // 日本語文字列の比較
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return valueA.localeCompare(valueB, 'ja');
        }

        // 数値やnullの比較
        valueA = valueA ?? 0;
        valueB = valueB ?? 0;
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      });

      // 🔽 ここで昇順・降順を制御
      return direction === 'asc' ? sorted : sorted.reverse();
    };

    this.dataSource.sort = this.sort;
  }

  updateTableData(): void {
    this.dataSource.data = this.filteredReports;
    this.dataSource.sort = this.sort;
    // 選択状態をリセット
    this.selectedReports = new Set<number>();
  }

  get filteredReports(): ReportDto[] {
    return this.reports.filter((r) => r.reportMonth === this.selectedMonth);
  }

  formatDate(input: string, mode: 'month' | 'date' | 'datetime'): string {
    if (!input) return '';
    const date = new Date(input);
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    const hh = ('0' + date.getHours()).slice(-2);
    const mm = ('0' + date.getMinutes()).slice(-2);

    switch (mode) {
      case 'month':
        return `${y}/${m}`;
      case 'date':
        return `${m}/${d}`;
      case 'datetime':
        return `${y}/${m}/${d} ${hh}:${mm}`;
      default:
        return '';
    }
  }

  hasValue(str?: string | null): boolean {
    return !!str && str.trim().length > 0;
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
      this.filteredReports.forEach((r) => this.selectedReports.add(r.id));
    } else {
      this.selectedReports.clear();
    }
  }

  isAllSelected(): boolean {
    return (
      this.filteredReports.length > 0 &&
      this.filteredReports.every((r) => this.selectedReports.has(r.id))
    );
  }

  isSomeSelected(): boolean {
    const selectedCount = this.filteredReports.filter((r) =>
      this.selectedReports.has(r.id)
    ).length;
    return selectedCount > 0 && selectedCount < this.filteredReports.length;
  }
  
  exportSelectedReports(): void {
    if (this.selectedReports.size === 0) {
      alert('少なくとも1件の報告書を選択してください。');
      return;
    }

    from([...this.selectedReports])
      .pipe(
        concatMap((id) =>
          this.reportService.downloadReportExcel(id).pipe(
            tap((res) =>
              this.excelDownloadService.download(res, `report-${id}.xlsx`)
            )
          )
        )
      )
      .subscribe();
  }
}
