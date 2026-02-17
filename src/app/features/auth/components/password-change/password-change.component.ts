import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import zxcvbn from 'zxcvbn';

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.password.trim()) {
      this.errorMessage = 'パスワードを入力してください。';
      return;
    }

    const result = zxcvbn(this.password);
    if (!this.isStrongPassword(this.password)) {
      this.errorMessage = 'パスワード形式が正しくありません。';
      return;
    }

    if (result.score < 3) {
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

    if (!this.isStrongPassword(password)) {
      this.passwordStrength = 'パスワード形式が正しくありません。';
      this.passwordStrengthClass = 'text-danger';
      return;
    }

    const result = zxcvbn(password);

    if (result.score >= 3) {
      this.passwordStrength = '使用可能なパスワードです。';
      this.passwordStrengthClass = 'text-success';
    } else {
      this.passwordStrength = 'パスワードが弱すぎます。';
      this.passwordStrengthClass = 'text-danger';
    }
  }

  private isStrongPassword(password: string): boolean {
    // 9～16文字
    const lengthOk = password.length >= 9 && password.length <= 16;
    // 英大文字必須
    const hasUpper = /[A-Z]/.test(password);
    // 英小文字必須
    const hasLower = /[a-z]/.test(password);
    // 数字必須
    const hasNumber = /\d/.test(password);
    // 記号必須
    const hasSymbol = /[\^$+\-*/|()\[\]{}<>.,?!_=&@~%#:;'"]/.test(password);
    // スペース禁止
    const hasSpace = /\s/.test(password);

    return (lengthOk && hasUpper && hasLower && hasNumber && hasSymbol && !hasSpace);
  }

  sanitizePassword(event: any): void {
    const value = event.target.value;

    // ASCIIのみ許可（日本語・全角除去）
    const sanitized = value.replace(/[^\x20-\x7E]/g, '');

    event.target.value = sanitized;
    this.password = sanitized;
  }
}