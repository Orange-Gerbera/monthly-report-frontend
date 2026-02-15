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
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  showForm = false;
  useLatest = false;
  previousUrl: string = '';

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit(): void {
    // 自分が今いる場所（/employees/profile など）を保存
    this.previousUrl = this.location.path();
  }

  get userName(): string | null {
    return this.authService.getCurrentUser()?.name || null;
  }
}
