import {
  Component,
  Input,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { ReportDto } from '../../models/report.dto';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { ReportDueDateService } from '../../../report-due-dates/services/report-due-date.service';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './report-table.component.html',
})
export class ReportTableComponent implements OnInit, AfterViewInit {
  @Input() filterByUser = false;

  dataSource = new MatTableDataSource<ReportDto>();
  displayedColumns: string[] = [
    'reportMonth',
    'dueDate',
    'submittedAt',
    'completeFlg',
    'approvalFlg',
    'comment',
    'actions',
  ];
  dueDateOfCurrentMonth?: Date;
  currentMonth: number = new Date().getMonth() + 1;
  previousUrl: string = '/reports'; 
 
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private reportDueDateService: ReportDueDateService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // 現在の月の提出期日を取得
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    this.reportDueDateService.getDueDate(year, month).subscribe({
      next: (dueDate) => {
        this.dueDateOfCurrentMonth = dueDate;
      },
      error: (err) => {
        console.error('提出期日取得エラー:', err);
      },
    });

    // レポート一覧を取得
    const currentUser = this.authService.getCurrentUser();
    this.reportService.getReports().subscribe((response) => {
      let reports = response.reportList;

      if (this.filterByUser && currentUser) {
        reports = reports.filter(
          (r) => String(r.employeeCode) === currentUser.code
        );

        // --- 未提出のダミー報告書追加---
        const now = new Date();
        const targetDate = this.getCurrentTargetMonth(now); // 判定された年・月を取得

        const year = targetDate.getFullYear();
        const month = ('0' + (targetDate.getMonth() + 1)).slice(-2);
        const currentMonthStr = `${year}-${month}`; // 例: "2024-02"

        // 今月分（判定された月）のデータがあるか確認
        const hasCurrentMonthReport = reports.some(r => r.reportMonth.startsWith(currentMonthStr));

        if (!hasCurrentMonthReport) {
          const placeholder: any = {
            id: null,
            reportMonth: currentMonthStr,
            dueDate: this.dueDateOfCurrentMonth,
            submittedAt: null,
            completeFlg: false,
            employeeCode: currentUser.code
          };
          reports.push(placeholder);
        }
         // --- 10日基準の月判定ロジック ---
      }

      reports.sort((a, b) => b.reportMonth.localeCompare(a.reportMonth));

      this.dataSource.data = reports;

      // 自分が今いる場所（/employees/profile など）を保存
      this.previousUrl = this.location.path();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  formatDate(
    input: string,
    mode: 'month' | 'date' | 'datetime' | 'datetimeWithDay'
  ): string {
    if (!input) return '';
    const date = new Date(input);
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    const hh = ('0' + date.getHours()).slice(-2);
    const mm = ('0' + date.getMinutes()).slice(-2);

    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

    switch (mode) {
      case 'month':
        return `${y}/${m}`;
      case 'date':
        return `${m}/${d}`;
      case 'datetime':
        return `${y}/${m}/${d} ${hh}:${mm}`;
      case 'datetimeWithDay':
        return `${y}/${m}/${d}(${dayOfWeek})${hh}:${mm}`;
      default:
        return '';
    }
  }

  /**
   * 10日基準で「何月分の報告書か」を判定する
   * 10日〜末日 -> その月
   * 1日〜9日   -> 前の月
   */
  getCurrentTargetMonth(date: Date): Date {
    const d = new Date(date.getTime());
    const day = d.getDate();
    
    if (day < 10) {
      // 9日以前なら、1ヶ月前の日付を返す
      d.setMonth(d.getMonth() - 1);
    }
    return d;
  }
}
