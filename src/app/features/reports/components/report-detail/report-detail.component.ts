import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report.service';
import { Observable, map } from 'rxjs';
import { ReportDto } from '../../models/report.dto';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharCountComponent } from '../../../../shared/char-count/char-count.component';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ExcelDownloadService } from '../../services/excel-download.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApproveConfirmDialogComponent } from '../approve-confirm-dialog/approve-confirm-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Location } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-report-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CharCountComponent,
    ButtonComponent,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
})
export class ReportDetailComponent {
  report$!: Observable<ReportDto>;

  isCommentFormVisible = false;
  commentText = '';
  timeWorkedHour: number = 0;
  timeWorkedMinute: number = 0;
  timeOverHour: number = 0;
  timeOverMinute: number = 0;
  previousUrl: string = '/reports'; 

  private currentReportId: string = '';
  private currentReportMonth: string = '';

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService,
    private excelDownloadService: ExcelDownloadService,
    private dialog: MatDialog,
    private location: Location
  ) {
    const navigation = this.router.getCurrentNavigation();
    // state自体が存在するか、'previousUrl' が含まれているかをチェック
    if (navigation?.extras?.state?.['previousUrl']) {
      this.previousUrl = navigation.extras.state['previousUrl'];
    }

    this.loadReport();
  }

  get reportMonth(): string {
    return this.currentReportMonth;
  }

  // 一覧に戻るボタンの実装
  onBack() {
    //取得済みの previousUrl（デフォルトは /reports）へ遷移
    this.router.navigateByUrl(this.previousUrl);
  }

  loadReport(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.currentReportId = id;

    this.report$ = this.reportService.getReportById(id, true).pipe(
      map((res) => {
        const report = res.report;

        // 年月を保持（例: "2025-07"）
        this.currentReportMonth = report.reportMonth;

        // 分 → 時間＋分
        this.timeWorkedHour = Math.floor(report.timeWorked / 60);
        this.timeWorkedMinute = report.timeWorked % 60;
        this.timeOverHour = Math.floor(report.timeOver / 60);
        this.timeOverMinute = report.timeOver % 60;

        return report;
      })
    );
  }

  onDelete(id: number): void {
    if (confirm('この報告書を削除してもよろしいですか？')) {
      this.reportService.deleteReport(id).subscribe({
        next: () => this.router.navigate(['/reports']),
        error: (err) => {
          console.error('削除エラー:', err);
          alert('削除に失敗しました');
        },
      });
    }
  }

  onApprove(id: number): void {
    const dialogRef = this.dialog.open(ApproveConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'approve' || result === 'deny') {
        const approve = result === 'approve';

        this.reportService.approveReport(id, approve).subscribe({
          next: () => {
            alert(approve ? '承認しました。' : '否認にしました。');
            this.router.navigate(['/reports'], {
              queryParams: { selectedMonth: this.currentReportMonth },
            });
          },
          error: (err) => {
            console.error('承認処理に失敗しました:', err);
            alert('承認処理に失敗しました。');
          },
        });
      }
      // キャンセル（×）やESCキーで閉じたときは何もしない
    });
  }

  onSubmitComment(id: number): void {
    if (!this.commentText.trim()) {
      alert('コメントを入力してください。');
      return;
    }

    this.reportService.commentOnReport(id, this.commentText).subscribe({
      next: () => {
        alert('コメントを追加しました。');
        this.commentText = '';
        this.isCommentFormVisible = false;
        this.loadReport(); // 再取得して最新のコメントを反映
      },
      error: (err) => {
        console.error('コメント送信失敗:', err);
        alert('コメントの送信に失敗しました。');
      },
    });
  }

  toggleCommentForm(initialComment: string | null): void {
    this.isCommentFormVisible = !this.isCommentFormVisible;

    if (this.isCommentFormVisible) {
      this.commentText = initialComment || '';
    }
  }

  onExportExcel(reportId: number): void {
    this.reportService.downloadReportExcel(reportId).subscribe((res) => {
      this.excelDownloadService.download(res, `report-${reportId}.xlsx`);
    });
  }

  isMine(report: ReportDto): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // 現在のユーザーが報告書の作成者かどうか
    return report.employeeName === currentUser.name;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
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

  openReportInNewTab(offset: number): void {
    if (!this.currentReportId || !this.currentReportMonth) return;

    const [year, month] = this.currentReportMonth.split('-').map(Number);
    let targetYear = year;
    let targetMonth = month + offset;

    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }

    const ym = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    this.reportService
      .getReportByYearMonth(this.currentReportId, ym)
      .subscribe({
        next: (res) => window.open(`/reports/${res.report.id}`, '_blank'),
        error: () =>
          alert(`指定された月（${ym}）の報告書は見つかりませんでした。`),
      });
  }
}
