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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email;
    } else {
      this.authService.fetchMe().subscribe(u => {
        this.userEmail = u?.email ?? '';
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

    if (!PasswordUtil.isStrong(this.password, this.userEmail)) {
      this.errorMessage = 'パスワードが弱すぎます。';
      return;
    }

    this.authService.changePassword(this.password).subscribe({
      next: () => {
        alert('パスワードを変更しました。');
        this.router.navigate(['/reports']);
      },
      error: () => {
        this.errorMessage = 'パスワード変更に失敗しました。';
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

    if (result.score >= 3) {
      this.passwordStrength = '使用可能なパスワードです。';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength = 'パスワードが弱すぎます。';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  sanitizePassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = PasswordUtil.sanitize(input.value);

    input.value = sanitized;
    this.password = sanitized;
  }
}