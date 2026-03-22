import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  private deptId$ = new BehaviorSubject<number | undefined>(
    this.loadFromStorage()
  );

  selectedDeptId$ = this.deptId$.asObservable();

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