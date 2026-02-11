import { http, HttpResponse } from 'msw';
import type { EmployeeDto } from '../../app/features/employees/models/employee.dto';
import { employeeStore } from '../db/employee.store';

// 環境側の baseUrl が `/api` 前提でルーティング
const BASE = '/api/employees';

// ----------------------------------------------------
// ヘルパ
// ----------------------------------------------------
function parseTokenFromRequest(req: Request): string | undefined {
  // 1) Authorization: Bearer <token>
  const auth =
    req.headers.get('authorization') || req.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring('Bearer '.length).trim();
  }

  // 2) Cookie: token=<token>
  const cookie = req.headers.get('cookie') || req.headers.get('Cookie');
  if (cookie) {
    const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return undefined;
}

function buildFullName(lastName: string, firstName: string) {
  return `${lastName} ${firstName}`.trim();
}

function notFound(message: string) {
  return HttpResponse.json({ error: message }, { status: 404 });
}

function badRequest(message: string) {
  return HttpResponse.json({ error: message }, { status: 400 });
}

// ----------------------------------------------------
// ハンドラ本体
// ----------------------------------------------------
export const employeeHandlers = [
  // 一覧取得: GET /api/employees
  http.get(`${BASE}`, () => {
    const list = employeeStore.employees; // または employeeStore.list()
    return HttpResponse.json(
      { listSize: list.length, employeeList: list },
      { status: 200 }
    );
  }),

  // 自分情報: GET /api/employees/me
  http.get(`${BASE}/me`, ({ request }) => {
    const token = parseTokenFromRequest(request);
    if (!token) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = employeeStore.getSession(token);
    if (!session) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const me = employeeStore.employees.find((e) => e.code === session.code);
    if (!me) {
      return notFound('Employee not found');
    }
    return HttpResponse.json<EmployeeDto>(me, { status: 200 });
  }),

  // 個別取得: GET /api/employees/:code
  http.get(`${BASE}/:code`, ({ params }) => {
    const raw = params?.['code'];
    const code = Array.isArray(raw) ? raw[0] : raw;

    if (!code) {
      return badRequest('Path parameter "code" is required');
    }

    const emp = employeeStore.employees.find((e) => e.code === code);
    if (!emp) return notFound('Employee not found');

    return HttpResponse.json<EmployeeDto>(emp, { status: 200 });
  }),

  // 作成: POST /api/employees
  // 期待ボディ: EmployeeRequest（password は任意）
  http.post(`${BASE}`, async ({ request }) => {
    const body = (await request.json()) as any;

    // 必須チェック
    const required = [
      'code',
      'lastName',
      'firstName',
      'email',
      'role',
      'departmentName',
    ];
    const missing = required.filter((k) => !body?.[k]);
    if (missing.length) {
      return badRequest(`Missing fields: ${missing.join(', ')}`);
    }

    // 既存チェック
    if (employeeStore.employees.some((e) => e.code === body.code)) {
      return badRequest('Employee code already exists');
    }

    const created: EmployeeDto = {
      code: body.code,
      lastName: body.lastName,
      firstName: body.firstName,
      fullName: buildFullName(body.lastName, body.firstName),
      email: body.email,
      role: body.role,
      departmentName: body.departmentName,
      employmentStatus: body.employmentStatus ?? 'EMPLOYED',
      active: body.active ?? true,
    };

    employeeStore.employees.push(created);
    if (body.password) {
      employeeStore.credentials.set(body.code, body.password);
    }

    return HttpResponse.json<EmployeeDto>(created, { status: 201 });
  }),

  // 更新: PUT /api/employees/:code
  // 期待ボディ: EmployeeRequest（password があれば資格情報も更新）
  http.put(`${BASE}/:code`, async ({ params, request }) => {
    // params.code は string | string[] | undefined の可能性がある
    const raw = params?.['code'];
    const code = Array.isArray(raw) ? raw[0] : raw;

    if (!code) {
      return badRequest('Path parameter "code" is required');
    }

    const idx = employeeStore.employees.findIndex((e) => e.code === code);
    if (idx < 0) return notFound('Employee not found');

    const body = (await request.json()) as any;

    // code の不整合は弾く（URL優先）
    if (body.code && body.code !== code) {
      return badRequest('Code in path and body must match');
    }

    const current = employeeStore.employees[idx];
    const updated: EmployeeDto = {
      code: current.code,
      lastName: body.lastName ?? current.lastName,
      firstName: body.firstName ?? current.firstName,
      fullName: buildFullName(
        body.lastName ?? current.lastName,
        body.firstName ?? current.firstName
      ),
      email: body.email ?? current.email,
      role: body.role ?? current.role,
      departmentName: body.departmentName ?? current.departmentName,
      employmentStatus:
        body.employmentStatus ?? current.employmentStatus,
      active: body.active ?? current.active,
    };

    employeeStore.employees[idx] = updated;

    if (typeof body.password === 'string' && body.password.length > 0) {
      employeeStore.credentials.set(code, body.password);
    }

    return HttpResponse.json<EmployeeDto>(updated, { status: 200 });
  }),

  // 削除: DELETE /api/employees/:code
  http.delete(`${BASE}/:code`, ({ params }) => {
    // params.code は string | string[] | undefined の可能性があるため、安全に取得
    const raw = params?.['code'];
    const code = Array.isArray(raw) ? raw[0] : raw;

    if (!code) {
      return badRequest('Path parameter "code" is required');
    }

    const idx = employeeStore.employees.findIndex((e) => e.code === code);
    if (idx < 0) return notFound('Employee not found');

    employeeStore.employees.splice(idx, 1);
    employeeStore.credentials.delete(code);

    // セッション等も消したい場合はストアの実装に合わせてここで削除（オプショナル）
    // if (employeeStore.deleteSessionsByCode) employeeStore.deleteSessionsByCode(code);

    return new HttpResponse(null, { status: 204 });
  }),
];

export default employeeHandlers;
