import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmployeeRequest } from '../../models/employee.dto';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/department.dto';
import { NgForm } from '@angular/forms';
import { IconComponent } from '../../../../shared/icon/icon.component';
import zxcvbn from 'zxcvbn';

@Component({
  selector: 'app-employee-new',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './employee-new.component.html',
})
export class EmployeeNewComponent {
  employee: EmployeeRequest = {
    code: '',
    lastName: '',
    firstName: '',
    email: '',
    role: 'GENERAL',
    departmentName: '',
    employmentStatus: 'EMPLOYED',
    active: true,
    password: '',
  };

  roleOptions = [
    { label: '一般', value: 'GENERAL' },
    { label: '管理者', value: 'ADMIN' },
  ];

  departments: DepartmentDto[] = [];

  passwordStrength = '';
  passwordStrengthClass = '';

  showPassword = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private departmentService: DepartmentService
  ) {
    this.fetchDepartments();
  }

  fetchDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => (this.departments = data),
      error: (err) => console.error('所属一覧の取得に失敗しました', err),
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const password = this.employee.password ?? '';

    // パスワードチェック
    if (!this.isPasswordValid(password)) {
      alert('パスワード形式が正しくありません');
      return;
    }

    const result = zxcvbn(password);
    if (result.score < 3) {
      alert('パスワードが弱すぎます');
      return;
    }

    this.http.post('/api/employees', this.employee).subscribe({
      next: () => this.router.navigate(['/employees']),
      error: (err) =>
        alert('登録に失敗しました: ' + (err.error?.message || err.statusText)),
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      this.passwordStrengthClass = '';
      return;
    }

    if (!this.isPasswordValid(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません';
      this.passwordStrengthClass = 'text-danger';
      return;
    }

    const result = zxcvbn(password);

    if (result.score >= 3) {
      this.passwordStrength = '使用可能なパスワードです';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength = '形式は正しいですが強度が弱いです';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  sanitizePassword(event: any): void {
    const value = event.target.value;

    // 全角・日本語を除去（ASCIIのみ）
    const sanitized = value.replace(/[^\x20-\x7E]/g, '');

    event.target.value = sanitized;
    this.employee.password = sanitized;
  }

  isPasswordValid(password: string): boolean {
    const lengthOk = password.length >= 9 && password.length <= 16;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[\^$+\-*/|()\[\]{}<>.,?!_=&@~%#:;'"]/.test(password);
    const hasSpace = /\s/.test(password);

    return lengthOk && hasUpper && hasLower && hasNumber && hasSymbol && !hasSpace;
  }

}
