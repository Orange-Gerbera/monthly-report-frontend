import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report.service';
import { Observable, map, tap } from 'rxjs';
import { ReportDto } from '../../models/report.dto';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CharCountComponent } from '../../../../shared/char-count/char-count.component';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ExcelDownloadService } from '../../services/excel-download.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    ConfirmDialogComponent,
  ],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
})
export class ReportDetailComponent implements OnInit {
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
  ) {
    const navigation = this.router.getCurrentNavigation();
    // state自体が存在するか、'previousUrl' が含まれているかをチェック
    if (navigation?.extras?.state?.['previousUrl']) {
      this.previousUrl = navigation.extras.state['previousUrl'];
    }
  }

  get reportMonth(): string {
    return this.currentReportMonth;
  }

  ngOnInit(): void {
    this.loadReport();
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

      tap(res => {
        const report = res.report;

        this.currentReportMonth = report.reportMonth;

        this.timeWorkedHour = Math.floor(report.timeWorked / 60);
        this.timeWorkedMinute = report.timeWorked % 60;

        this.timeOverHour = Math.floor(report.timeOver / 60);
        this.timeOverMinute = report.timeOver % 60;
      }),

      map(res => res.report)

    );
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '削除の確認',
        message: 'この報告書を完全に削除しますか？\nこの操作は取り消せません。',
        okLabel: '削除する',
        okColor: 'red' // 削除なので注意を促す赤
      },
      // Safari/iOSでの挙動を安定させるためのオプション（任意）
      autoFocus: false,
      restoreFocus: true
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      // result にはダイアログで「削除する」を押した時に true が入る
      if (result) {
        this.executeDelete(id);
      }
    });
  }

  private executeDelete(id: number): void {
    this.reportService.deleteReport(id).subscribe({
      next: () => {
        console.log('削除成功');
        this.router.navigateByUrl(this.previousUrl);
      },
      error: (err) => {
        console.error('削除失敗', err);
        alert('削除に失敗しました。');
      }
    });
  }

  onApprove(id: number): void {

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: '承認処理',
        message: '処理を選択してください',
        buttons: [
          { label: '承認する', value: true, color: 'green' },
          { label: '否認', value: false, color: 'red' },
          { label: '取消し', value: null, color: 'gray' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result === undefined) return;

      this.reportService.approveReport(id, result).subscribe({

        next: () => {
          this.loadReport();
        },

        error: err => this.showError(err)
      });

    });

  }

  onReceive(id: number): void {

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '420px',
    data: {
      title: '受理処理',
      message: '処理を選択してください',
      buttons: [
        { label: '受理する', value: true, color: 'green' },
        { label: '差戻し', value: false, color: 'red' },
        { label: '取消し', value: null, color: 'gray' }
      ]
    }
  });

  dialogRef.afterClosed().subscribe(result => {

    if (result === undefined) return;

    // ★ 差戻しのとき確認を出す
    if (result === false) {

      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: '差戻し確認',
          message:
            '差戻しを選択すると提出が解除されます。\n' +
            '受理するには再提出が必要になりますが、差戻しを設定してもよろしいですか？',
          okLabel: '差戻しする',
          okColor: 'red'
        }
      });

      confirmRef.afterClosed().subscribe(confirm => {

        if (!confirm) return;

        this.executeReceive(id, result);

      });

      return;
    }

    this.executeReceive(id, result);

  });

}

  private executeReceive(id: number, result: boolean | null) {

    this.reportService.receiveReport(id, result).subscribe({

      next: () => {
        this.loadReport();
      },

      error: err => this.showError(err)
    });

  }

  onSubmitToggle(id: number, submit: boolean): void {

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: submit ? '提出確認' : '提出取り下げ確認',
        message: submit ? 'この報告書を提出しますか？' : '報告書の提出を取り下げますか？',
        okLabel: submit ? '提出する' : '取り下げする',
        okColor: submit ? 'blue' : 'gray'
      }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (!result) return;

      this.reportService.submitReport(id, submit).subscribe({

        next: () => {
          alert(submit ? '提出しました' : '提出を取り下げました');
          this.loadReport();
        },

        error: err => this.showError(err)
      });

    });

  }

  onSubmitComment(id: number): void {
    const comment = this.commentText ?? '';

    this.reportService.commentOnReport(id, comment).subscribe({
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

  getLastName(name: string | null | undefined): string {
    if (!name) return '-';
    return name.trim().split(/\s+/)[0];
  }

  private showError(err: any) {

    console.error('API Error:', err);

    let message = '処理に失敗しました';

    if (err?.error) {

      if (typeof err.error === 'string') {
        message = err.error;
      }

      else if (err.error.message) {
        message = err.error.message;
      }

      else if (err.error.error) {
        message = err.error.error;
      }

    }

    alert(message);
  }
}

