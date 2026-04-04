import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { ContextService } from '../../shared/services/context.service';
import { FormsModule } from '@angular/forms';
import { DepartmentResponse } from '../../features/employees/models/employee.dto';
import { filter, take } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  managerDepartments: DepartmentResponse[] = [];
  allDepartments: DepartmentResponse[] = [];
  selectedDepartmentId?: number;

  constructor(
    private authService: AuthService,
    private router: Router,
    private contextService: ContextService
  ) { }

  initialized = false;
  isContextLocked = false;

  ngOnInit(): void {
    // ロック状態を監視し、HTML側に反映させる
    this.contextService.isLocked.subscribe(locked => {
      this.isContextLocked = locked;
    });

    this.authService.getCurrentUser$()
      .pipe(
        filter(user => !!user),
        take(1)
      )
      .subscribe(user => {
        if (!user) return;

        const isAdmin =
          user.role === 'ADMIN' ||
          user.role === 'SYSTEM_ADMIN';

        const rawDepartments = user.departments ?? [];
        if (isAdmin) {
          this.managerDepartments =
            rawDepartments.filter(d => d.manager);
          if (this.managerDepartments.length === 0) {
            this.managerDepartments = rawDepartments;
          }
        } else {
          this.managerDepartments = rawDepartments;
        }

        this.allDepartments = rawDepartments;

        let current = this.contextService.getDeptId();

        if (
          current == null ||
          !this.managerDepartments.some(d => d.id === current)
        ) {
          current = this.managerDepartments[0]?.id;
        }

        this.selectedDepartmentId = current;

        if (current != null) {
          this.contextService.setContext(current, this.displayDepartmentName);
        }

        this.initialized = true; // ⭐追加
      });
  }

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

  onDepartmentChange(): void {
    if (this.selectedDepartmentId != null) {
      // get displayDepartmentName の結果（Adminなら自分、Generalなら親の名前）をセット
      this.contextService.setContext(this.selectedDepartmentId, this.displayDepartmentName);
    }
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

  get displayDepartmentName(): string {
    // ★重要：Number() を使って、数値と文字列の不一致を解消する
    const selected = this.managerDepartments.find(
      d => Number(d.id) === Number(this.selectedDepartmentId)
    );

    if (!selected) {
      console.warn('選択された部署が見つかりません:', this.selectedDepartmentId);
      return '';
    }

    // 管理者なら自分、一般なら親（＝プロジェクト名）
    if (selected.manager === true) {
      return selected.name;
    }

    return selected.parentName ?? '---';
  }
}
