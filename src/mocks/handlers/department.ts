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

import { http, HttpResponse } from 'msw';
import type { DepartmentDto } from '../../app/features/departments/models/department.dto';
import { departmentStore } from '../db/department.store';

const BASE = '/api/departments';

// 共通ヘルパ
function badRequest(message: string) {
  return HttpResponse.json({ error: message }, { status: 400 });
}
function notFound(message: string) {
  return HttpResponse.json({ error: message }, { status: 404 });
}

export const departmentHandlers = [
  // 一覧: GET /api/departments
  http.get(`${BASE}`, () => {
    const list = departmentStore.list();
    return HttpResponse.json<DepartmentDto[]>(list, { status: 200 });
  }),

  // 追加: POST /api/departments  body: { name }
  http.post(`${BASE}`, async ({ request }) => {
    const body = (await request.json()) as Partial<DepartmentDto>;
    const name = (body?.name ?? '').trim();
    if (!name) return badRequest('name is required');

    try {
      const created = departmentStore.create({ name });
      return HttpResponse.json<DepartmentDto>(created, { status: 201 });
    } catch (e: any) {
      if (String(e?.message).includes('already exists')) {
        return badRequest('Department name already exists');
      }
      return badRequest(e?.message ?? 'Bad request');
    }
  }),

  // 削除: DELETE /api/departments/:id
  http.delete(`${BASE}/:id`, ({ params }) => {
    const raw = params?.['id'];
    const idStr = Array.isArray(raw) ? raw[0] : raw;
    if (!idStr) return badRequest('Path parameter "id" is required');

    const id = Number(idStr);
    if (!Number.isFinite(id)) return badRequest('"id" must be a number');

    const ok = departmentStore.delete(id);
    if (!ok) return notFound('Department not found');

    return new HttpResponse(null, { status: 204 });
  }),
];

export default departmentHandlers;
