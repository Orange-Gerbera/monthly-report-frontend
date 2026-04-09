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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { ReportDto, ReportUpsertRequest } from '../../models/report.dto';
import { AuthService } from '../../../auth/services/auth.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ActivatedRoute } from '@angular/router';
import { ReportFormComponent } from '../report-form/report-form.component';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ContextService } from '../../../../shared/services/context.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-report-new',
  imports: [
    CommonModule,
    ReportFormComponent,
  ],
  templateUrl: './report-new.component.html',
  styleUrls: ['./report-new.component.scss'],
})
export class ReportNewComponent implements OnInit, OnDestroy {

  useLatest = false;
  previousUrl: string = '/profile';

  report: ReportUpsertRequest = {
    reportMonth: '',
    contentBusiness: '',
    timeWorked: 0,
    timeOver: 0,
    rateBusiness: 0,
    rateStudy: 0,
    trendBusiness: 0,
    contentMember: '',
    contentCustomer: '',
    contentProblem: '【問題点】\n【解決策】\n【ヒヤリハット】',
    evaluationBusiness: '',
    evaluationStudy: '',
    goalBusiness: '',
    goalStudy: '',
    contentCompany: '',
    contentOthers: '',
    completeFlg: false,
    employeeCode: '',
    employeeName: '',
    departmentName: '',
  };

  isDisabled = false;
  errorMessage: string | null = null;

  private currentDeptId?: number;
  private destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private location: Location,
    private dialog: MatDialog,
    private context: ContextService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['previousUrl']) {
      this.previousUrl = navigation.extras.state['previousUrl'];
    }
  }

  ngOnInit(): void {
    // =========================
    // ★ 追加：画面表示時にコンテキストをロック
    // =========================
    this.context.setLocked(true);

    // ⭐ Contextから部署ID取得
    this.context.selectedDeptId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(deptId => {

        this.currentDeptId = deptId ?? undefined;

        if (this.currentDeptId != null) {
          this.checkDueDate(); // ← ここが重要
        }
      });

    const useLatestParam = this.route.snapshot.queryParamMap.get('useLatest');
    this.useLatest = useLatestParam === 'true';

    const user = this.authService.getCurrentUser();
    if (user) {
      this.report.employeeCode = user.code;

      this.employeeService.getByCode(user.code).subscribe({
        next: (employee) => {

          const primaryDept = employee.departments?.find(d => d.primary);

          this.report = {
            ...this.report,
            employeeName: employee.fullName ?? '',
            departmentName: primaryDept?.name ?? '',
          };

          if (this.useLatest) {
            this.loadLatestReport();
          }

          const now = new Date();
          const targetDate = this.getCurrentTargetMonth(now);

          this.report = {
            ...this.report,
            reportMonth: `${targetDate.getFullYear()}-${String(
              targetDate.getMonth() + 1
            ).padStart(2, '0')}`,
          };
        },
        error: (err) => {
          console.error('社員情報の取得に失敗しました', err);
        },
      });
    }
  }

  ngOnDestroy(): void {
    // =========================
    // ★ 追加：画面を離れる時にロックを解除
    // =========================
    this.context.setLocked(false);
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================
  // 提出日チェック
  // =========================
  checkDueDate(): void {

    if (!this.currentDeptId) {
      this.isDisabled = true;
      this.errorMessage = '部署が選択されていません';
      return;
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;

    this.reportService.getDueDate(yearMonth, this.currentDeptId).subscribe({
      next: (dueDate) => {

        if (!dueDate) {
          this.isDisabled = true;
          this.errorMessage = '提出日が設定されていません。';
        }

      },
      error: (err) => {
        this.isDisabled = true;
        this.errorMessage =
          err.error?.message || '提出日の取得に失敗しました';
      }
    });
  }

  // =========================
  // 作成
  // =========================
  onCreate(report: ReportUpsertRequest): void {

    if (this.isDisabled) {
      alert('提出日が設定されていないため、報告書を作成できません。');
      return;
    }

    this.reportService.createReport(report).subscribe({
      next: () => {
        alert('報告書を登録しました');
        this.router.navigateByUrl(this.previousUrl);
      },
      error: (err) => {
        const message =
          err?.error?.message ?? '登録に失敗しました。';
        alert(message);
      },
    });
  }

  // =========================
  // 戻る
  // =========================
  onBack() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '内容の破棄',
        message: '編集中の内容は保存されませんが、よろしいですか？',
        okLabel: '破棄して戻る',
        okColor: 'red'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.router.navigateByUrl(this.previousUrl);
      }
    });
  }

  // =========================
  // 最新コピー
  // =========================
  private loadLatestReport(): void {
    this.reportService.getLatestReport().subscribe({
      next: (latest: ReportDto) => {
        if (latest) {
          this.report = {
            ...this.report,
            contentBusiness: latest.contentBusiness,
            timeWorked: latest.timeWorked,
            timeOver: latest.timeOver,
            rateBusiness: latest.rateBusiness,
            rateStudy: latest.rateStudy,
            trendBusiness: latest.trendBusiness,
            contentMember: latest.contentMember,
            contentCustomer: latest.contentCustomer,
            contentProblem: latest.contentProblem,
            evaluationBusiness: latest.evaluationBusiness,
            evaluationStudy: latest.evaluationStudy,
            goalBusiness: latest.goalBusiness,
            goalStudy: latest.goalStudy,
            contentCompany: latest.contentCompany,
            contentOthers: latest.contentOthers,
          };
        }
      },
      error: (err) => {
        console.error('直近の報告書取得に失敗しました', err);
      },
    });
  }

  // =========================
  // 月計算
  // =========================
  private getCurrentTargetMonth(date: Date): Date {
    const d = new Date(date);

    if (d.getDate() < 10) {
      d.setMonth(d.getMonth() - 1);
    }

    return d;
  }
}