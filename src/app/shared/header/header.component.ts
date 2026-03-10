import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(private authService: AuthService, private router: Router) {}

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('ログアウトに失敗しました', err);
      },
    });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isSystemAdmin(): boolean {
    return this.authService.isSystemAdmin();
  }

  get userName(): string | null {
    return this.authService.getCurrentUser()?.name || null;
  }

  closeNavbar(): void {
    const navbar = document.getElementById('navbarNav');
    if (navbar) {
      const collapseInstance = bootstrap.Collapse.getInstance(navbar);
      if (collapseInstance) {
        collapseInstance.hide(); // メニューを閉じる
      }
    }
  }
}
