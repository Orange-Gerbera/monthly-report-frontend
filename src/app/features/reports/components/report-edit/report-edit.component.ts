import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { ReportDto, ReportUpsertRequest } from '../../models/report.dto';
import { ReportFormComponent } from '../report-form/report-form.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-report-edit',
  standalone: true,
  imports: [CommonModule, ReportFormComponent],
  templateUrl: './report-edit.component.html',
})
export class ReportEditComponent implements OnInit {
  reportId!: string;
  previousUrl: string = '/reports';

  /** 取得した元データ（サーバ管理項目保持用） */
  original: ReportDto | null = null;

  /** フォームへ渡すモデル（共通のUpsert型） */
  formModel: ReportUpsertRequest | null = null;

  loading = true;

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private router: Router,
    private dialog: MatDialog
  ) {
    // コンストラクタで詳細画面から渡された state を受け取る
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['previousUrl']) {
      this.previousUrl = navigation.extras.state['previousUrl'];
    }

  }

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id')!;
    this.reportService.getReportById(this.reportId, true).subscribe({
      next: (res) => {
        this.original = res.report;
        this.formModel = this.toFormModel(res.report);
        this.loading = false;
      },
      error: (err) => {
        console.error('取得失敗:', err);
        this.loading = false;
      },
    });
  }

  /** ReportDto → ReportUpsertRequest（フォーム用） */
  private toFormModel(dto: ReportDto): ReportUpsertRequest {
    return {
      reportMonth: dto.reportMonth ?? '',
      contentBusiness: dto.contentBusiness ?? '',
      timeWorked: dto.timeWorked ?? 0,
      timeOver: dto.timeOver ?? 0,
      rateBusiness: dto.rateBusiness ?? 0,
      rateStudy: dto.rateStudy ?? 0,
      trendBusiness: dto.trendBusiness ?? 0,
      contentMember: dto.contentMember ?? '',
      contentCustomer: dto.contentCustomer ?? '',
      contentProblem: dto.contentProblem ?? '',
      evaluationBusiness: dto.evaluationBusiness ?? '',
      evaluationStudy: dto.evaluationStudy ?? '',
      goalBusiness: dto.goalBusiness ?? '',
      goalStudy: dto.goalStudy ?? '',
      contentCompany: dto.contentCompany ?? '',
      contentOthers: dto.contentOthers ?? '',
      completeFlg: !!dto.completeFlg,
      // フォーム契約上の表示用も保持
      employeeCode: dto.employeeCode ?? '',
      employeeName: dto.employeeName ?? '',
      departmentName: dto.departmentName ?? '',
    };
  }

  /** 共通フォームの submit を受けて更新 */
  onSubmitFromForm(formValue: ReportUpsertRequest): void {
    if (!this.original) return;

    // null上書き防止：original をベースに完全体へマージして送る
    const payload: ReportDto = {
      ...this.original,
      ...formValue,
      id: this.original.id,
      // 変更不可にしたい項目は original を優先（必要に応じて）
      employeeCode: this.original.employeeCode,
      employeeName: this.original.employeeName,
      departmentName: this.original.departmentName,
      // submittedAt / updatedAt / reportDeadline / dueDate / approvalFlg / comment は original を維持
    };

    this.reportService
      .updateReport(String(this.original.id), payload)
      .subscribe({
        next: () => {
          alert('報告書を更新しました');
          // 詳細画面へ戻る際、受け取った previousUrl を再セットする
          this.router.navigate(['/reports', this.reportId], { 
            state: { previousUrl: this.previousUrl } 
          });
        },
        error: (err) => {
          console.error('更新に失敗しました:', err);
          alert(err?.error?.message ?? '報告書の更新に失敗しました');
        },
      });
  }

  onCancel(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '編集の破棄',
        message: '編集中の内容は保存されませんが、よろしいですか？',
        okLabel: '破棄して戻る',
        okColor: 'red'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // キャンセル時も state を維持して詳細に戻る
        this.router.navigate(['/reports', this.reportId], { 
          state: { previousUrl: this.previousUrl } 
        });
      }
    });
  }
}
