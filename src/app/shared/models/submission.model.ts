export interface Submission {
  type: 'MONTHLY' | 'PROJECT' | 'EXPENSE' | 'BONUS';
  inputMethod: 'WEB' | 'FILE';

  name: string;

  dueDate: string;          // ← 追加
  submittedAt: string | null;

  status?: {                // ← 追加（optional）
    received?: boolean | null;
    approved?: boolean | null;
  };

  id?: number;
}