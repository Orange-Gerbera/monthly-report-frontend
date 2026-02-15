import { Component, OnInit } from '@angular/core';
import { ReportDueDateService } from '../../services/report-due-date.service';
import { ReportDueDateDto } from '../../models/report-due-date.dto';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-due-date-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatSnackBarModule,
    MatInputModule,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './due-date-list.component.html',
  styleUrls: ['./due-date-list.component.scss'],
})
export class DueDateListComponent implements OnInit {
  displayedColumns: string[] = ['firstHalf', 'secondHalf'];
  dueDates: ReportDueDateDto[] = [];
  filteredDueDates: ReportDueDateDto[] = [];

  years: number[] = [];
  selectedYear: number = new Date().getFullYear();
  newYear: number = new Date().getFullYear(); // 新規登録用の年入力欄
  isRegistering: boolean = false;
  isEditing = false;
  backupDueDates: ReportDueDateDto[] = [];

  hasValidationError = false;

  constructor(
    private dueDateService: ReportDueDateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDueDates();
  }

  get hasEmptyDueDates(): boolean {
    return this.filteredDueDates.some((d) => !d.dueDateTime);
  }

  private loadDueDates(): void {
    this.dueDateService.getAll().subscribe({
      next: (data) => {
        this.dueDates = data.sort((a, b) => {
          if (a.year !== b.year) {
            return b.year - a.year; // 新しい年を先頭
          }
          return a.month - b.month;
        });

        // 年一覧を抽出してソート（重複除去）
        this.years = Array.from(new Set(this.dueDates.map((d) => d.year))).sort(
          (a, b) => b - a
        );

        // 初期フィルタ
        this.filterByYear();
      },
      error: (err) => {
        console.error('提出期日の取得に失敗しました', err);
        this.snackBar.open('提出期日の取得に失敗しました', 'OK', {
          duration: 3000,
        });
      },
    });
  }

  filterByYear(): void {
    this.filteredDueDates = this.dueDates
      .filter((d) => d.year === this.selectedYear)
      .sort((a, b) => a.month - b.month);
  }

  registerYear(): void {
    if (!this.newYear || isNaN(this.newYear)) {
      this.snackBar.open('有効な年を入力してください', 'OK', {
        duration: 3000,
      });
      return;
    }

    this.dueDateService.registerYear(this.newYear).subscribe({
      next: () => {
        this.snackBar.open(`${this.newYear}年の期日を登録しました`, 'OK', {
          duration: 3000,
        });
        this.loadDueDates(); // 再読み込み
        this.selectedYear = this.newYear;
        this.isRegistering = false; // 登録成功時
      },
      error: (err) => {
        if (err.status === 409) {
          this.snackBar.open(
            `${this.newYear}年はすでに登録されています`,
            'OK',
            { duration: 3000 }
          );
        } else {
          this.snackBar.open('登録に失敗しました', 'OK', { duration: 3000 });
        }
      },
    });
  }

  // 削除
  deleteYear(): void {
    if (!confirm(`${this.newYear}年の提出期日を削除しますか？`)) {
      return;
    }

    this.dueDateService.deleteYear(this.newYear).subscribe({
      next: () => {
        this.snackBar.open(`${this.newYear}年の期日を削除しました`, 'OK', {
          duration: 3000,
        });
        this.loadDueDates();
      },
      error: (err) => {
        console.error('削除に失敗しました', err);
        this.snackBar.open('削除に失敗しました', 'OK', { duration: 3000 });
      },
    });
  }

  startEdit() {
    this.backupDueDates = JSON.parse(JSON.stringify(this.filteredDueDates)); // deep copy
    this.isEditing = true;
    this.isRegistering = false;
  }

  cancelEdit() {
    this.filteredDueDates = JSON.parse(JSON.stringify(this.backupDueDates));
    this.isEditing = false;
    this.isRegistering = false; // 年度管理を無効にする
  }

  toggleEdit() {
    if (this.isEditing) {
      this.saveAllDueDates(); // 保存処理（API呼び出し等）
    }
    this.isEditing = !this.isEditing;
  }

  saveAllDueDates() {
    // 1. バリデーションチェック：未入力があれば保存不可
    const hasEmpty = this.filteredDueDates.some((d) => !d.dueDateTime);
    this.hasValidationError = hasEmpty;

    if (hasEmpty) {
      this.snackBar.open('未入力の提出期日があります', 'OK', {
        duration: 3000,
      });
      return;
    }

    // 2. 保存処理（API呼び出し）
    this.dueDateService.updateAll(this.filteredDueDates).subscribe({
      next: (updated) => {
        this.snackBar.open('提出期日を保存しました', 'OK', {
          duration: 3000,
        });
        this.isEditing = false;
        this.filteredDueDates = updated.sort((a, b) => a.month - b.month);
        this.backupDueDates = JSON.parse(JSON.stringify(this.filteredDueDates)); // 最新バックアップ
      },
      error: (err) => {
        console.error('提出期日の保存に失敗しました', err);
        this.snackBar.open('提出期日の保存に失敗しました', 'OK', {
          duration: 3000,
        });
      },
    });
  }

  toggleRegistering() {
    this.isRegistering = !this.isRegistering;
    if (this.isRegistering) {
      this.isEditing = false; // 編集モードを無効にする
    }
  }

  getMinDateTime(due: { year: number; month: number }): string {
    const year = due.year;
    const month = due.month;
    const date = new Date(year, month - 1, 1, 0, 0); // 月は0始まり
    return this.toLocalDateTimeString(date);
  }

  getMaxDateTime(due: { year: number; month: number }): string {
    let year = due.year;
    let month = due.month + 1;
    // 月が13になったら翌年の1月に補正
    if (month > 12) {
      year += 1;
      month = 1;
    }
    const lastDay = new Date(year, month, 0).getDate(); // 次の月の末日
    const date = new Date(year, month - 1, lastDay, 23, 59); // JSは0-indexedの月
    return this.toLocalDateTimeString(date);
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes())
    );
  }
}
