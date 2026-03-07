import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PasswordUtil } from '../../../../shared/utils/password.util';

@Component({
  selector: 'app-setup-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-password.component.html',
})
export class SetupPasswordComponent implements OnInit {
  private readonly API_BASE = `${environment.apiBaseUrl}/password`;

  token: string | null = null;
  loading = true;
  validToken = false;
  errorMessage = '';
  successMessage = '';

  password = '';
  showPassword = false;
  submitting = false;

  passwordStrength = '';
  passwordStrengthClass = '';

  userEmail = '';
  userRole = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.errorMessage = 'トークンが指定されていません。';
      this.loading = false;
      return;
    }

    this.http
      .get<any>(`${this.API_BASE}/validate`, {
        params: { token: this.token },
      })
      .subscribe({
        next: (res) => {
          this.validToken = true;

          // validate API が role と email を返す前提
          this.userRole = res?.role ?? '';
          this.userEmail = res?.email ?? '';

          this.loading = false;
        },
        error: () => {
          this.errorMessage = '無効または期限切れトークンです。';
          this.loading = false;
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.password = sanitized;
  }

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      this.passwordStrengthClass = '';
      return;
    }

    if (!PasswordUtil.isFormatValid(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません。';
      this.passwordStrengthClass = 'text-danger';
      return;
    }

    const result = PasswordUtil.getStrength(password, this.userEmail);
    const requiredScore = this.getRequiredScore();

    if (result.score >= requiredScore) {
      this.passwordStrength =
        this.userRole === 'ADMIN' || this.userRole === 'ROLE_ADMIN'
          ? '管理者用として使用可能なパスワードです。'
          : '使用可能なパスワードです。';

      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength =
        this.userRole === 'ADMIN' || this.userRole === 'ROLE_ADMIN'
          ? '管理者用のパスワードとしては強度が足りません。'
          : 'パスワードが弱すぎます。';

      this.passwordStrengthClass = 'text-danger';
    }
  }

  private getRequiredScore(): number {
    // ROLE_ADMIN にも対応
    if (this.userRole === 'ADMIN' || this.userRole === 'ROLE_ADMIN') {
      return 4;
    }
    return 3;
  }

  submit(): void {
    if (this.submitting) return;
    if (!this.validToken) return;

    if (!this.password.trim()) {
      this.errorMessage = 'パスワードを入力してください。';
      return;
    }

    if (!PasswordUtil.isFormatValid(this.password)) {
      this.errorMessage = 'パスワード形式が正しくありません。';
      return;
    }

    const requiredScore = this.getRequiredScore();

    if (!PasswordUtil.isStrong(this.password, this.userEmail, requiredScore)) {
      this.errorMessage =
        this.userRole === 'ADMIN' || this.userRole === 'ROLE_ADMIN'
          ? '管理者用のパスワードとしては強度が足りません。'
          : 'パスワードが弱すぎます。';
      return;
    }

    this.submitting = true;

    this.http
      .post<{message:string}>(`${this.API_BASE}/reset`, {
        token: this.token,
        newPassword: this.password,
      }, { observe: 'response' })
      .subscribe({
        next: () => {
          this.errorMessage = '';
          this.successMessage =
            'パスワードを設定しました。ログイン画面へ移動します。';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          console.log("ERROR", err);
          this.submitting = false;
          this.errorMessage =
            err.error?.message || 'パスワード設定に失敗しました。';
        },
      });
  }
}