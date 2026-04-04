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

  private contextText$ = new BehaviorSubject<string>(this.loadNameFromStorage());
  contextText = this.contextText$.asObservable();

  // ★ロック状態をセットするメソッド
  setLocked(locked: boolean) {
    this.isLocked$.next(locked);
  }

  setContext(id: number, name: string) {
    console.log(`🔥 Context Update: ID=${id}, Name=${name}`);
    
    // IDの保存
    localStorage.setItem('deptId', String(id));
    this.deptId$.next(id);

    // 名前の保存（これが「オレンジガーベラプロジェクト」になる）
    localStorage.setItem('contextText', name);
    this.contextText$.next(name);
  }

  setDeptId(id?: number) {
    console.log("🔥 setDeptId =", id);

    if (id != null) {
      localStorage.setItem('deptId', String(id));
    } else {
      localStorage.removeItem('deptId');
      this.contextText$.next('');
      localStorage.removeItem('contextText');
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

  private loadNameFromStorage(): string {
    return localStorage.getItem('contextText') || '';
  }
}