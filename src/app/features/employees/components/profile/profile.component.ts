import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeEditComponent } from '../employee-edit/employee-edit.component';
import { SubmissionTableComponent } from '../../../reports/components/submission-table/submission-table.component';
import { AuthService } from '../../../auth/services/auth.service';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ContextService } from '../../../../shared/services/context.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Submission } from '../../../../shared/models/submission.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeEditComponent,
    SubmissionTableComponent,
    RouterModule,
    ButtonComponent,
    FormsModule,
    IconComponent,
    MatTooltipModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  showForm = false;
  useLatest = false;
  previousUrl: string = '';
  currentDate = new Date();

  constructor(
    private authService: AuthService,
    private location: Location,
    private contextService: ContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.previousUrl = this.location.path();
  }

  // システム管理者判定
  get isSystemAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'SYSTEM_ADMIN';
  }

  get userName(): string | null {
    return this.authService.getCurrentUser()?.name || null;
  }

  get displayDepartmentName(): string {
    const user = this.authService.getCurrentUser();
    const primary = user?.departments?.find(d => d.primary);

    if (!primary) {
      console.warn('primary部署が存在しません', user);
    }

    return primary?.name ?? '未所属';
  }

  // 表示用年月
  get currentYearMonth(): string {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth() + 1;
    return `${y}年${m}月`;
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.currentDate = new Date(this.currentDate);
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.currentDate = new Date(this.currentDate);
  }

  getButtonIcon(data: Submission): string {

    if (data.inputMethod === 'WEB') {
      return data.submittedAt ? 'file-text' : 'file-plus-corner';
    }

    return data.submittedAt ? 'file-up' : 'file-up';
  }

  getButtonLabel(data: Submission): string {

    if (data.inputMethod === 'WEB') {
      return data.submittedAt ? '詳細' : '作成';
    }

    return data.submittedAt ? '再提出' : '提出';
  }

  onAction(data: Submission) {

    if (data.inputMethod === 'WEB') {

      if (data.submittedAt && data.id) {
        this.router.navigate(['/reports', data.id]);
      } else {
        this.router.navigate(['/reports/new']);
      }

      return;
    }

    // FILE
    this.openUploadModal(data);
  }

  openUploadModal(data: Submission) {
    console.log('アップロード対象:', data);
    alert('アップロード画面（仮）');
  }
}