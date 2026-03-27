import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmployeeRequest } from '../../models/employee.dto';
import { DepartmentService } from '../../../departments/services/department.service';
import { DepartmentDto } from '../../../departments/models/department.dto';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { PasswordUtil } from '../../../../shared/utils/password.util';
import { ContextService } from '../../../../shared/services/context.service';

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
    departmentId: null,
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private departmentService: DepartmentService,
    private context: ContextService
  ) {
    this.fetchDepartments();
  }

  // =========================
  // 初期化
  // =========================
  ngOnInit(): void {
    this.fetchDepartments();

    this.context.selectedDeptId$.subscribe(() => {
      this.fetchDepartments();
    });
  }

  fetchDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (data) => {

        const parentId = this.context.getDeptId();

        this.departments = (data ?? []).filter(d =>
          d.parentId === parentId && d.id !== 1
        );

        // 👇 デフォルト選択（重要）
        if (!this.employee.departmentId && this.departments.length) {
          this.employee.departmentId = this.departments[0].id;
        }
      },
      error: (err) => console.error('所属一覧の取得に失敗しました', err),
    });
  }

  // =========================
  // 登録処理
  // =========================
  onSubmit(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

     if (!this.employee.departmentId) {
        alert('所属を選択してください');
        return;
      }

    const password = this.employee.password ?? '';

    // 🔹 パスワードが入力されている場合のみチェック
    if (password) {

      if (!PasswordUtil.isFormatValid(password)) {
        alert('パスワード形式が正しくありません');
        return;
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
    }

    this.http.post('/api/employees', this.employee).subscribe({
      next: () => {

        if (!password) {
          alert('登録が完了しました。\n招待メールを送信しました。');
        } else {
          alert('登録が完了しました。');
        }

        this.router.navigate(['/employees']);
      },
      error: (err) =>
        alert('登録に失敗しました: ' + (err.error?.message || err.statusText)),
    });
  }

  // =========================
  // email / role変更時の再チェック
  // =========================
  onEmailChange(): void {
    this.recheckPassword();
  }

  onRoleChange(): void {
    this.recheckPassword();
  }

  private recheckPassword(): void {
    if (this.employee.password) {
      this.checkPasswordStrength(this.employee.password);
    }
  }

  // =========================
  // パスワード強度表示
  // =========================
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

  // =========================
  // 送信ボタン制御
  // =========================
  isPasswordInvalid(): boolean {

    const password = this.employee.password ?? '';

    // 🔹 空欄はOK（招待メールモード）
    if (!password) return false;

    return (
      !PasswordUtil.isFormatValid(password) ||
      this.passwordScore < this.getRequiredScore()
    );
  }

  private getRequiredScore(): number {
    return this.employee.role === 'ADMIN' ? 4 : 3;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.employee.password = sanitized;
  }
}