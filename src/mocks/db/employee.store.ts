import type {
  EmployeeDto,
  EmployeeRequest,
} from '../../app/features/employees/models/employee.dto';
import { seedEmployees, seedEmployeeCredentials } from './seed/employee.seed';

export type Session = { code: string };

export class EmployeeStore {
  /** UIで使う従業員の台帳（strictに EmployeeDto 準拠） */
  employees: EmployeeDto[] = [];
  /** 認証用の資格情報（code -> password）。EmployeeDto とは分離 */
  credentials = new Map<string, string>();
  /** ログインセッション（token -> { code }） */
  sessions = new Map<string, Session>();

  constructor() {
    this.reset();
  }

  /** すべてをシード状態に戻す（テスト・開発で便利） */
  reset() {
    this.employees = seedEmployees();
    this.credentials = new Map(
      seedEmployeeCredentials().map((c) => [c.code, c.password])
    );
    this.sessions.clear();
  }

  /** 一覧（防御的コピー） */
  list(): EmployeeDto[] {
    return this.employees.slice();
  }

  /** 主キー（code）検索 */
  findByCode(code: string): EmployeeDto | null {
    return this.employees.find((e) => e.code === code) ?? null;
  }

  /** 追加／更新（EmployeeRequestを受け、EmployeeDtoを返す） */
  upsert(req: EmployeeRequest): EmployeeDto {
    const idx = this.employees.findIndex((e) => e.code === req.code);
    const buildFullName = (last: string, first: string) => `${last} ${first}`;

    if (idx >= 0) {
      // update
      const cur = this.employees[idx];
      const updated: EmployeeDto = {
        ...cur,
        code: req.code,
        lastName: req.lastName,
        firstName: req.firstName,
        fullName: buildFullName(req.lastName, req.firstName),
        email: req.email,
        role: req.role,
        departmentName: req.departmentName,
        employmentStatus: req.employmentStatus ?? cur.employmentStatus,
        active: req.active ?? cur.active,
      };
      this.employees[idx] = updated;

      if (req.password) this.credentials.set(req.code, req.password);
      return updated;
    } else {
      // create
      const created: EmployeeDto = {
        code: req.code,
        lastName: req.lastName,
        firstName: req.firstName,
        fullName: buildFullName(req.lastName, req.firstName),
        email: req.email,
        role: req.role,
        departmentName: req.departmentName,
        employmentStatus: req.employmentStatus ?? 'EMPLOYED',
        active: req.active ?? true,
      };
      this.employees.push(created);

      if (req.password) this.credentials.set(req.code, req.password);
      return created;
    }
  }

  /** 削除（存在すれば true） */
  delete(code: string): boolean {
    const idx = this.employees.findIndex((e) => e.code === code);
    if (idx < 0) return false;
    this.employees.splice(idx, 1);
    this.credentials.delete(code);
    // 該当ユーザーの既存セッションも掃除
    for (const [token, sess] of this.sessions.entries()) {
      if (sess.code === code) this.sessions.delete(token);
    }
    return true;
  }

  /** 認証: パスワード検証 */
  verifyPassword(code: string, password: string): boolean {
    const stored = this.credentials.get(code);
    return !!stored && stored === password;
  }

  /** 認証: パスワード設定（管理画面などのモック用） */
  setPassword(code: string, password: string) {
    this.credentials.set(code, password);
  }

  /** セッション: 設定 / 取得 / 破棄（authハンドラから利用） */
  setSession(token: string, code: string) {
    this.sessions.set(token, { code });
  }
  getSession(token: string): Session | undefined {
    return this.sessions.get(token);
  }
  deleteSession(token: string) {
    this.sessions.delete(token);
  }
}

export const employeeStore = new EmployeeStore();
