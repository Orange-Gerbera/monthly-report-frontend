/**
 * Project: Orange Gerbera
 * -----------------------------------------------------------------------------
 * Copyright (c) 2024-2026 Tai Naoyuki & Kagoshima Takuho.
 * All rights reserved.
 * 
 * This software and any associated documentation are the intellectual property
 * of Tai Naoyuki & Kagoshima Takuho.
 * 
 * Unauthorized copying, use, or distribution of this software,
 * in whole or in part, is strictly prohibited.
 * -----------------------------------------------------------------------------
 */

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

        // ngOnInit 内の初期化ロジック
        this.allDepartments = rawDepartments;

        // 1. セレクトボックスに表示する「親（Manager=1）」のリストを作成
        this.managerDepartments = rawDepartments.filter(d => d.manager === true);

        let current = this.contextService.getDeptId();

        // 2. 初期値（current）が妥当かチェック
        // managerDepartmentsの中に current が存在しない場合は初期化が必要
        if (
          current == null ||
          !this.managerDepartments.some(d => Number(d.id) === Number(current))
        ) {
          // ⭐【最重要】自分のメイン所属（primary=true）を起点に「親」を特定する
          const primaryDept = rawDepartments.find(d => d.primary === true);

          if (primaryDept) {
            if (primaryDept.manager === true) {
              // 自分が管理者として親部署に所属している場合
              current = primaryDept.id;
            } else {
              // 一般（General）などで子(manager=0)に所属している場合
              // ⭐自分の ID ではなく、親の ID (parentId) を current に入れる
              current = primaryDept.parentId;
            }
          }

          // 親リストの先頭を最終的な予備とする
          if (current == null) {
            current = this.managerDepartments[0]?.id;
          }
        }

        // 3. selectedDepartmentId には「親のID」がセットされる
        this.selectedDepartmentId = current;

        if (current != null) {
          // ContextService に保存されるのは「親のID」と「その親の名称」
          this.contextService.setContext(current, this.displayDepartmentName);
        }

        this.initialized = true;
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
    // selectedDepartmentId は常に「親（Manager=true）」のID
    // ただし一般ユーザーは managerDepartments に親を持っていない場合があるため、
    // allDepartments（または primaryDept.parentName）から取得する必要があります。
    
    const primaryDept = this.allDepartments.find(d => d.primary === true);
    
    // 管理者の場合：セレクトボックスで選んでいる「親」の名前
    if (this.isAdmin) {
      const selected = this.managerDepartments.find(
        d => Number(d.id) === Number(this.selectedDepartmentId)
      );
      return selected ? selected.name : '---';
    }

    // 一般ユーザーの場合：自分が属する「親（プロジェクト）」の名前
    return primaryDept?.parentName ?? '---';
  }
}
