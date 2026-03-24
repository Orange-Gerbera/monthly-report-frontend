import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeEditComponent } from '../employee-edit/employee-edit.component';
import { ReportTableComponent } from '../../../reports/components/report-table/report-table.component';
import { AuthService } from '../../../auth/services/auth.service';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { ContextService } from '../../../../shared/services/context.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeEditComponent,
    ReportTableComponent,
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

  constructor(
    private authService: AuthService,
    private location: Location,
    private contextService: ContextService
  ) {}

  ngOnInit(): void {
    // 自分が今いる場所（/employees/profile など）を保存
    this.previousUrl = this.location.path();
  }

  // ⭐ ロール判定を追加
  get isSystemAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    // RoleがSYSTEM_ADMIN、またはID:1（固定）の場合に真を返す
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
}
