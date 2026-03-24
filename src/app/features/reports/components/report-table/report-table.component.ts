import {
  Component,
  Input,
  OnInit,
  OnDestroy,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../../../../shared/services/context.service';
import { Subject, takeUntil, distinctUntilChanged, switchMap, of } from 'rxjs';

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
    MatTooltipModule,
  ],
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss'],
})
export class ReportTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() filterByUser = false;

  dataSource = new MatTableDataSource<ReportDto>();
  displayedColumns: string[] = [
    'reportMonth',
    'dueDate',
    'submittedAt',
    'status',
    'comment',
    'actions',
  ];
  dueDateOfCurrentMonth?: Date;
  currentMonth: number = new Date().getMonth() + 1;
  previousUrl: string = '/reports'; 
 
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();
  private currentDeptId?: number;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private reportDueDateService: ReportDueDateService,
    private location: Location,
    private context: ContextService
  ) {}

  ngOnInit(): void {
    // レポート一覧を取得
    const currentUser = this.authService.getCurrentUser();
    this.context.selectedDeptId$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        switchMap(deptId => {
          console.log("🔥 deptId =", deptId);
          this.currentDeptId = deptId ?? undefined;

          if (this.currentDeptId == null) {
            return of({ reportList: [] });
          }

          // ⭐修正1：初期表示用の今月の提出期日取得（引数に currentDeptId を追加）
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          
          this.reportDueDateService.getDueDate(year, month, this.currentDeptId).subscribe({
            next: (dueDate) => {
              this.dueDateOfCurrentMonth = dueDate;
            },
            error: (err) => {
              console.error('提出期日取得エラー:', err);
            },
          });

          return this.reportService.getReports({
            scopeDeptId: this.currentDeptId,
            mine: this.filterByUser
          });
        })
      )
      .subscribe((response: { reportList: ReportDto[] }) => {

       let reports = response.reportList;

        if (this.filterByUser && currentUser) {
          reports = reports.filter(
            (r: ReportDto) => String(r.employeeCode) === currentUser.code
          );

          // --- 未提出ダミー処理（そのまま維持） ---
          const now = new Date();
          const targetDate = this.getCurrentTargetMonth(now);

          const year = targetDate.getFullYear();
          const month = ('0' + (targetDate.getMonth() + 1)).slice(-2);
          const currentMonthStr = `${year}-${month}`;

          const hasCurrentMonthReport =
            reports.some((r: ReportDto) => r.reportMonth === currentMonthStr);

          if (!hasCurrentMonthReport) {
            const [y, m] = currentMonthStr.split('-');

            // ⭐修正2：ダミー行作成用の期日取得（引数に currentDeptId を追加）
            this.reportDueDateService
              .getDueDate(Number(y), Number(m), this.currentDeptId!)
              .subscribe(dueDate => {
                const placeholder: ReportDto = {
                  id: 0,
                  reportMonth: currentMonthStr,
                  submittedAt: null,
                  updatedAt: null,
                  contentBusiness: '',
                  timeWorked: 0,
                  timeOver: 0,
                  rateBusiness: 0,
                  rateStudy: 0,
                  trendBusiness: 0,
                  contentMember: '',
                  contentCustomer: '',
                  contentProblem: '',
                  evaluationBusiness: '',
                  evaluationStudy: '',
                  goalBusiness: '',
                  goalStudy: '',
                  contentCompany: '',
                  contentOthers: '',
                  completeFlg: false,
                  comment: null,
                  reportDeadline: '',
                  approvalFlg: null,
                  approvedAt: null,
                  approvedBy: null,
                  approvedByName: null,
                  receivedFlg: null,
                  receivedAt: null,
                  receivedBy: null,
                  receivedByName: null,
                  employeeCode: currentUser.code,
                  employeeName: '',
                  departmentName: '',
                  dueDate: dueDate ? dueDate.toISOString() : null
                };

                reports.push(placeholder);

                reports.sort((a: ReportDto, b: ReportDto) =>
                  b.reportMonth.localeCompare(a.reportMonth)
                );
                this.dataSource.data = reports;
              });

            return;
          }
        }

        reports.sort((a: ReportDto, b: ReportDto) =>
          b.reportMonth.localeCompare(a.reportMonth)
        );
        this.dataSource.data = reports;

        this.previousUrl = this.location.path();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
