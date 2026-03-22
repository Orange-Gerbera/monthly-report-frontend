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

    const user = employeeStore.findByCode(body.code);

    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!user.active) {
      return HttpResponse.json({ message: 'Account disabled' }, { status: 403 });
    }

    if (!user.enabled) {
      return HttpResponse.json(
        { message: 'Initial password not set' },
        { status: 403 }
      );
    }

    // パスワード検証を store に委譲
    if (!employeeStore.verifyPassword(body.code, body.password)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  
    const token = makeToken(user.code);
    employeeStore.setSession(token, user.code);

    const primaryDept = user.departments?.find(
      d => d.id === user.primaryDepartmentId
    );

    const res: LoginResponse = {
      token,
      code: user.code,
      name: user.fullName,
      role: user.role,
      email: user.email,
      departments: user.departments ?? [],
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

    const primaryDept = user.departments?.find(
      d => d.id === user.primaryDepartmentId
    );

    const res: LoginResponse = {
      token,
      code: user.code,
      name: user.fullName,
      role: user.role,
      email: user.email,
      departments: user.departments ?? [],
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
