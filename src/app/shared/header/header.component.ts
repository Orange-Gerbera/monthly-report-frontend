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

  ngOnInit(): void {
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
          this.contextService.setDeptId(current);
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
      this.contextService.setDeptId(this.selectedDepartmentId);
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

    const selected = this.managerDepartments.find(
      d => d.id === this.selectedDepartmentId
    );

    if (!selected) return '';

    // 管理者 → 自分
    if (selected.manager === true) {
      return selected.name;
    }

    // 一般 → 親
    return selected.parentName ?? '---';
  }
}
