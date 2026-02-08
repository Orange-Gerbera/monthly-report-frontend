import { http, HttpResponse } from 'msw';
import type { LoginResponse } from '../../app/features/auth/models/login-response.dto';
import { employeeStore } from '../db/employee.store';

const COOKIE_NAME = 'access_token';
const makeToken = (code: string) => `mock-token-${code}-${Date.now()}`;
const expireCookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      code?: string;
      password?: string;
    } | null;
    if (!body?.code || !body?.password) {
      return HttpResponse.json({ message: 'Bad Request' }, { status: 400 });
    }

    // パスワード検証を store に委譲
    if (!employeeStore.verifyPassword(body.code, body.password)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = employeeStore.findByCode(body.code)!;

    const token = makeToken(user.code);
    employeeStore.setSession(token, user.code);

    const res: LoginResponse = {
      token,
      code: user.code,
      name: user.fullName, // ← fullName を使う場合。nameを別管理なら user.firstName/lastName で合成
      role: user.role,
      email: user.email,
      department: user.departmentName,
      loginAt: new Date().toISOString(),
      passwordChangeRequired: false, 
    };

    return new HttpResponse(JSON.stringify(res), {
      status: 200,
      headers: {
        'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; Max-Age=86400; SameSite=Lax`,
        'Content-Type': 'application/json',
      },
    });
  }),

  http.get('/api/auth/me', ({ cookies }) => {
    const token = cookies[COOKIE_NAME];
    const sess = token ? employeeStore.getSession(token) : undefined;
    if (!sess) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401, headers: { 'Set-Cookie': expireCookie } }
      );
    }
    const user = employeeStore.findByCode(sess.code)!;

    const res: LoginResponse = {
      token,
      code: user.code,
      name: user.fullName,
      role: user.role,
      email: user.email,
      department: user.departmentName,
      loginAt: new Date().toISOString(),
      passwordChangeRequired: false, 
    };
    return HttpResponse.json(res, { status: 200 });
  }),

  http.post('/api/auth/logout', ({ cookies }) => {
    const token = cookies[COOKIE_NAME];
    if (token) employeeStore.deleteSession(token);
    return new HttpResponse('OK', {
      status: 200,
      headers: {
        'Set-Cookie': expireCookie,
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }),
];
