// src/app/features/security/pages/security-lock-page/security-lock-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SecurityLockService } from '../../services/security-lock.service';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface LockEntry {
  key: string;
  value: string;
}

@Component({
  selector: 'app-security-lock-page',
  standalone: true,
  // テンプレートで使用するコンポーネントをすべてここに含める
  imports: [
    CommonModule,
    IconComponent,
    ButtonComponent,
    MatTableModule,
    MatDialogModule,
    ConfirmDialogComponent
  ],
  templateUrl: './security-lock-page.component.html',
})
export class SecurityLockPageComponent implements OnInit {
  ipLockDataSource = new MatTableDataSource<LockEntry>([]);
  userLockDataSource = new MatTableDataSource<LockEntry>([]);
  loading = false;
  private loadingTimeout: any;

  constructor(
    private securityService: SecurityLockService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchLocks();
  }

  fetchLocks(): void {
    // 300ms以上かかった場合のみ loading を true にする
    this.loadingTimeout = setTimeout(() => {
      this.loading = true;
    }, 300);

    this.securityService.getLocks().subscribe({
      next: (data) => {
        // data が undefined の場合を考慮
        this.ipLockDataSource.data = this.mapToEntries(data?.ipLocks);
        this.userLockDataSource.data = this.mapToEntries(data?.userLocks);
        this.clearLoading();
      },
      error: () => {
        this.clearLoading();
      }
    });
  }
  // ローディング状態をリセットする補助メソッド
  private clearLoading(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout); // 待機中のタイマーを止める
    }
    this.loading = false; // 表示中のローディングを消す
  }

  onUnlockIp(ip: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'IPアクセス制限解除',
        message: `IPアドレス ${ip} の制限を解除してもよろしいですか？`,
        okLabel: '解除する',
        okColor: 'red'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.securityService.unlockIp(ip).subscribe(() => this.fetchLocks());
      }
    });
  }

  onUnlockUser(lockKey: string): void {
    const code = lockKey.split(':')[1] || lockKey;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'アカウントロック解除',
        message: `社員番号 ${code} のロックを解除してもよろしいですか？`,
        okLabel: '解除する',
        okColor: 'red'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.securityService.unlockUser(code).subscribe(() => this.fetchLocks());
      }
    });
  }

  // 引数を any または optional にして、テンプレートエラーを回避
  private mapToEntries(obj: any): LockEntry[] {
    if (!obj) return [];
    return Object.keys(obj).map(key => ({ key, value: obj[key] }));
  }
}