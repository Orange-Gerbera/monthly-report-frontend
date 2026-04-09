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

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report.service';
import { Observable, Subject, startWith, switchMap, map, tap, take, shareReplay  } from 'rxjs';
import { ReportDto } from '../../models/report.dto';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { DiffTextComponent } from '../../../../shared/components/diff-text/diff-text.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ExcelDownloadService } from '../../services/excel-download.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ContextService } from '../../../../shared/services/context.service';
import { MatIconModule } from '@angular/material/icon';
import { catchError } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-report-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonComponent,
    DiffTextComponent,
    MatDialogModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
})
export class ReportDetailComponent implements OnInit, OnDestroy {
  protected Math = Math;
  isCommentFormVisible = false;
  commentText = '';
  timeWorkedHour: number = 0;
  timeWorkedMinute: number = 0;
  timeOverHour: number = 0;
  timeOverMinute: number = 0;
  reportIds: number[] = [];
  currentIndex = 0;
  report$!: Observable<ReportDto>;
  previousUrl: string = '/reports';
  private reload$ = new Subject<void>();

  private destroyRef = inject(DestroyRef);

  showDiff = false;
  previousReport: ReportDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService,
    private excelDownloadService: ExcelDownloadService,
    private dialog: MatDialog,
    private context: ContextService
  ) {
    const navigation = this.router.getCurrentNavigation();

    const state = navigation?.extras?.state || history.state;

    if (state?.['reportIds']) {
      this.reportIds = state['reportIds'];
    }

    if (state?.['previousUrl']) {
      this.previousUrl = state['previousUrl'];
    }
  }

  ngOnInit(): void {
    // =========================
    // ★ 追加：画面表示時にコンテキストをロック
    // =========================
    this.context.setLocked(true);

    this.report$ = this.route.paramMap.pipe(

      map(params => params.get('id')!),

      switchMap(id =>
        this.reload$.pipe(
          startWith(null),

          switchMap(() =>
            this.reportService.getReportById(id, true).pipe(
              catchError(err => {
                console.error('report取得エラー', err);
                throw err; 
              })
            )
          ),

          map(res => res.report),

          tap(report => {
            this.timeWorkedHour = Math.floor(report.timeWorked / 60);
            this.timeWorkedMinute = report.timeWorked % 60;

            this.timeOverHour = Math.floor(report.timeOver / 60);
            this.timeOverMinute = report.timeOver % 60;

            const index = this.reportIds.indexOf(report.id);
            this.currentIndex = index >= 0 ? index : 0;

            // 前月のデータを自動ロード
            this.loadPreviousMonthData(report);
          })
        )
      ),

      shareReplay({ bufferSize: 1, refCount: true }) // ← ここも変更
    );
  }

  // =========================
  // ★ 追加：画面を離れる時にロックを解除
  // =========================
  ngOnDestroy(): void {
    this.context.setLocked(false);
  }

  private loadPreviousMonthData(current: ReportDto) {
    const [year, month] = current.reportMonth.split('-').map(Number);
    let targetYear = year;
    let targetMonth = month - 1;
    if (targetMonth <= 0) { targetMonth = 12; targetYear -= 1; }
    const ym = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    this.reportService.getReportByEmployeeAndMonth(current.employeeCode, ym).subscribe({
      next: (res) => this.previousReport = res.report,
      error: () => this.previousReport = null
    });
  }

  // 一覧に戻るボタンの実装
  onBack() {
    //取得済みの previousUrl（デフォルトは /reports）へ遷移
    this.router.navigateByUrl(this.previousUrl);
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {

    const target = event.target as HTMLElement;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();   // ←追加
      this.nextReport();
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();   // ←追加
      this.prevReport();
    }

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

  nextReport() {

    if (this.currentIndex >= this.reportIds.length - 1) return;

    const nextId = this.reportIds[this.currentIndex + 1];

    this.router.navigate(['/reports', nextId], {
      state: {
        reportIds: this.reportIds,
        previousUrl: this.previousUrl
      }
    });

  }

  prevReport() {

    if (this.currentIndex <= 0) return;

    const prevId = this.reportIds[this.currentIndex - 1];

    this.router.navigate(['/reports', prevId], {
      state: {
        reportIds: this.reportIds,
        previousUrl: this.previousUrl
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
          this.refresh();
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

      // 差戻しのとき確認を出す
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
        this.refresh();
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
        okLabel: submit ? '提出する' : '取り下げる',
        okColor: submit ? 'blue' : 'gray'
      }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (!result) return;

      this.reportService.submitReport(id, submit).subscribe({

        next: () => {
          this.refresh();
          alert(submit ? '提出しました' : '提出を取り下げました');
          // this.loadReport();
        },

        error: err => this.showError(err)
      });

    });

  }

  onSubmitComment(id: number): void {
    const comment = this.commentText ?? '';

    this.reportService.commentOnReport(id, comment).subscribe({
      next: () => {
        this.commentText = '';
        this.isCommentFormVisible = false;

        this.refresh();
        // this.loadReport();
      },
      error: (err) => {
        console.error('コメント送信失敗:', err);
        this.showError(err);
      }
    });
  }

  @ViewChild('commentBox') commentBox!: ElementRef;
  toggleCommentForm(initialComment: string | null): void {

    this.isCommentFormVisible = !this.isCommentFormVisible;

    if (this.isCommentFormVisible) {
      this.commentText = initialComment || '';

      setTimeout(() => {
        this.commentBox?.nativeElement.focus();
      });
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {

    if (this.isCommentFormVisible) {
      this.isCommentFormVisible = false;
    }

  }
  
  onExportExcel(reportId: number): void {

    this.report$.pipe(take(1)).subscribe(report => {

      const isMine = this.isMine(report);

      // 自分の報告書でない かつ 未受理
      if (!isMine && report.receivedFlg !== true) {
        alert('受理されていない報告書はExcel出力できません。');
        return;
      }

      this.reportService.downloadReportExcel(reportId).subscribe((res) => {
        this.excelDownloadService.download(res, `report-${reportId}.xlsx`);
      });

    });

  }

  isMine(report: ReportDto): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // 現在のユーザーが報告書の作成者かどうか
    return report.employeeCode === currentUser.code;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  openReportInNewTab(offset: number): void {
    this.report$.pipe(take(1)).subscribe({
      next: (report) => {
        const [year, month] = report.reportMonth.split('-').map(Number);
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
        const code = report.employeeCode;

        this.reportService.getReportByEmployeeAndMonth(code, ym).subscribe({
          next: (res) => {
            // ==========================================
            // ★ 修正ポイント：Angularのルーター経由でURLを生成する
            // ==========================================
            const url = this.router.serializeUrl(
              this.router.createUrlTree(['/reports', res.report.id])
            );

            // 'opener' を指定することでセッションが引き継がれやすくなります
            window.open(url, '_blank', 'opener');
          },
          error: (err) => {
            if (err.status === 404) {
              alert(`指定された月（${ym}）の報告書は見つかりませんでした。`);
            } else {
              this.showError(err);
            }
          }
        });
      },
      error: (err) => this.showError(err)
    });
  }

  private refresh() {
    this.reload$.next();
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

