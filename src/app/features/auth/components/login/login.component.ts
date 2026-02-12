import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/login-request.dto';
import { LoginResponse } from '../../models/login-response.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  companyId = '';
  code = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.companyId = localStorage.getItem('companyId') ?? '';
    this.code = localStorage.getItem('employeeCode') ?? '';
  }

  onSubmit(): void {
    const loginData: LoginRequest = {
      companyId: this.companyId,
      code: this.code,
      password: this.password,
    };

    this.authService.login(loginData).subscribe({
      next: (res: LoginResponse) => {
        localStorage.setItem('companyId', this.companyId);
        localStorage.setItem('employeeCode', this.code);

        if (res.passwordChangeRequired) {
          this.router.navigate(['/password-change']);
          return;
        }

        this.authService.fetchMe().subscribe({
          next: () => this.router.navigate(['/reports']),
          error: () =>
            (this.errorMessage =
              'ログイン後のユーザー情報取得に失敗しました。'),
        });
      },
      error: (err) => {
        if (typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage =
            err.error?.message ||
            'ログインに失敗しました。社員番号またはパスワードを確認してください。';
        }
      },
    });
  }

}
