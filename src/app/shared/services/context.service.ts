import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  // ★ロック状態を管理するSubjectを追加
  private isLocked$ = new BehaviorSubject<boolean>(false);
  // 外部から購読するためのObservable
  isLocked = this.isLocked$.asObservable();

  private deptId$ = new BehaviorSubject<number | undefined>(
    this.loadFromStorage()
  );

  selectedDeptId$ = this.deptId$.asObservable();

  // ★ロック状態をセットするメソッド
  setLocked(locked: boolean) {
    this.isLocked$.next(locked);
  }

  setDeptId(id?: number) {
    console.log("🔥 setDeptId =", id);

    if (id != null) {
      localStorage.setItem('deptId', String(id));
    } else {
      localStorage.removeItem('deptId');
    }

    this.deptId$.next(id);
  }

  getDeptId(): number | undefined {
    return this.deptId$.value;
  }

  private loadFromStorage(): number | undefined {
    const v = localStorage.getItem('deptId');
    return v ? Number(v) : undefined;
  }
}