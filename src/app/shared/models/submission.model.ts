export interface Submission {
  id: number;
  typeCode: number;   // ★修正
  name: string;
  dueDate: string;

  submittedAt: string | null;
  receivedFlg: boolean | null;   // ★修正
  approvedFlg: boolean | null;   // ★修正

  status: string;   // ★追加（超重要）
}