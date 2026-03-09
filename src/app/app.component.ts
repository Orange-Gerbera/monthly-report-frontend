import { Component, computed, effect, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './features/auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'monthly-report-frontend';
  showHeader = signal(true);

  constructor(private router: Router, private authService: AuthService) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd; // キャストが必要
        const url = nav.urlAfterRedirects;
        const hideHeader =
          url.startsWith('/login') ||
          url.startsWith('/password-change');
        this.showHeader.set(!hideHeader);
      });
  }

  ngOnInit(): void {
    const url = window.location.pathname;

    // パスワード設定画面（setup-password）は未ログイン前提なので、
    // 認証チェック（fetchMe）をスキップして、コンソールの401エラーを防ぐ
    if (url.includes('setup-password')) {
      return;
    }

    // それ以外の画面（ログイン画面、パスワード変更画面、メイン画面など）では
    // ユーザー情報を取得しにいく
    this.authService.fetchMe().subscribe();
  }
}
