import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordUtil } from '../../../../shared/utils/password.util';

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-change.component.html',
})
export class PasswordChangeComponent {
  password = '';
  errorMessage = '';
  showPassword = false;

  passwordStrength = '';
  passwordStrengthClass = '';

  userEmail = '';
  userRole = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email;
      this.userRole = user.role;
    } else {
      this.authService.fetchMe().subscribe(u => {
        this.userEmail = u?.email ?? '';
        this.userRole = u?.role ?? '';
      });
    }
  }

  onSubmit(): void {
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
        this.userRole === 'ADMIN'
          ? '管理者用のパスワードとしては強度が足りません。'
          : 'パスワードが弱すぎます。';
      return;
    }

    this.authService.changePassword(this.password).subscribe({
      next: () => {
        alert('パスワードを変更しました。');
        this.router.navigate(['/reports']);
      },
      error: (err) => {
        this.errorMessage = 'パスワード変更に失敗しました。: ' + (err.error?.message || err.statusText);
      },
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

    if (!PasswordUtil.isFormatValid(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません。';
      this.passwordStrengthClass = 'text-danger';
      return;
    }

    const result = PasswordUtil.getStrength(password, this.userEmail);
    const requiredScore = this.getRequiredScore();
    if (result.score >= requiredScore) {
      this.passwordStrength =
        this.userRole === 'ADMIN'
          ? '管理者用として使用可能なパスワードです。'
          : '使用可能なパスワードです。';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength =
        this.userRole === 'ADMIN'
          ? '管理者用のパスワードとしては強度が足りません。'
          : 'パスワードが弱すぎます。';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  private getRequiredScore(): number {
    return this.userRole === 'ADMIN' ? 4 : 3;
  }

  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.password = sanitized;
  }
}