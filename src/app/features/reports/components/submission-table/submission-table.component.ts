import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { RouterModule } from '@angular/router';
import { Submission } from '../../../../shared/models/submission.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../features/auth/services/auth.service';

@Component({
  selector: 'app-submission-table',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    RouterModule,
    MatTooltipModule
  ],
  templateUrl: './submission-table.component.html',
  styleUrls: ['./submission-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmissionTableComponent implements OnChanges {

  @Input() date!: Date;

  @Input() getButtonLabel!: (data: Submission) => string;
  @Input() getButtonIcon!: (data: Submission) => string;
  @Input() onAction!: (data: Submission) => void;

  dataList: Submission[] = [];

  // ★ 無駄API防止
  private lastTargetMonth?: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['date'] && this.date) {
      this.initData();
    }
  }

  initData() {
    if (!this.date) return;

    const user = this.authService.getCurrentUser();
    if (!user?.code) {
      console.error('ユーザー情報が取得できません');
      this.dataList = [];
      return;
    }

    const targetMonth = this.formatMonth(this.date);

    // ★ 同じ月ならAPI呼ばない
    if (this.lastTargetMonth === targetMonth) return;
    this.lastTargetMonth = targetMonth;

    this.http.get<Submission[]>('/api/submissions', {
      params: {
        targetMonth,
        userCode: user.code
      }
    }).subscribe({
      next: res => {
        this.dataList = res;
      },
      error: err => {
        console.error('submission取得失敗', err);
        this.dataList = [];
      }
    });
  }

  formatMonth(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }

  // ★ パフォーマンス最適化
  trackById(index: number, item: Submission) {
    return item.id;
  }
}