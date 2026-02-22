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
import { PasswordUtil } from '../../../../shared/utils/password.util';

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
  passwordScore = 0;

  showPassword = false;
  private originalRole?: string;

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

  ngOnInit(): void {
    this.fetchDepartments();
    this.originalRole = this.employee.role;
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const password = this.employee.password ?? '';

    // パスワードチェック
    if (!PasswordUtil.isFormatValid(password)) {
      alert('パスワード形式が正しくありません');
      return;
    }
 
    // 役職が変更されている場合、パスワードの強度を再チェック
    if (this.employee.role !== this.originalRole && password) {
      const requiredScore = this.getRequiredScore();
      if (!PasswordUtil.isStrong(password, this.employee.email, requiredScore)) {
        alert(
          this.employee.role === 'ADMIN'
            ? '管理者用のパスワードとしては強度が足りません'
            : 'パスワードが弱すぎます'
        );
        return;
      }
    }

    const requiredScore = this.getRequiredScore();
    if (!PasswordUtil.isStrong(password, this.employee.email, requiredScore)) {
      alert(
        this.employee.role === 'ADMIN'
          ? '管理者用のパスワードとしては強度が足りません'
          : 'パスワードが弱すぎます'
      );
      return;
    }

    this.http.post('/api/employees', this.employee).subscribe({
      next: () => this.router.navigate(['/employees']),
      error: (err) =>
        alert('登録に失敗しました: ' + (err.error?.message || err.statusText)),
    });
  }

  onEmailChange(): void {
    if (this.employee.password) {
      this.checkPasswordStrength(this.employee.password);
    }
  }

  onRoleChange(): void {
    if (this.employee.password) {
      this.checkPasswordStrength(this.employee.password);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      this.passwordStrengthClass = '';
      this.passwordScore = 0;
      return;
    }

    if (!PasswordUtil.isFormatValid(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません';
      this.passwordStrengthClass = 'text-danger';
      this.passwordScore = 0;
      return;
    }

    const result = PasswordUtil.getStrength(password, this.employee.email);
    this.passwordScore = result.score;

    const requiredScore = this.getRequiredScore();

    if (result.score >= requiredScore) {
      this.passwordStrength =
        this.employee.role === 'ADMIN'
          ? '管理者用として使用可能なパスワードです'
          : '使用可能なパスワードです';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength =
        this.employee.role === 'ADMIN'
          ? '管理者用のパスワードとしては強度が足りません'
          : 'パスワードが弱すぎます';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  isPasswordInvalid(): boolean {
    if (!this.employee.password) return true;

    return (
      !PasswordUtil.isFormatValid(this.employee.password) ||
      this.passwordScore < this.getRequiredScore()
    );
  }

  private getRequiredScore(): number {
    return this.employee.role === 'ADMIN' ? 4 : 3;
  }

  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.employee.password = sanitized;
  }
}
