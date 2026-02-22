import zxcvbn from 'zxcvbn';

export class PasswordUtil {

  /** emailからzxcvbn用userInputs生成 */
  static buildUserInputs(email?: string): string[] {
    if (!email) return [];

    const at = email.indexOf('@');
    if (at <= 0) return [];

    const local = email.substring(0, at);

    // 苗字 + 社員番号 分離
    const match = local.match(/^([a-zA-Z]+)(\d+)$/);

    if (match) {
      return [local, match[1], match[2]];
    }

    // 分離できない場合はそのまま
    return [local];
  }

  /** パスワード形式チェック */
  static isFormatValid(password: string): boolean {
    if (!password) return false;

    const lengthOk = password.length >= 9 && password.length <= 16;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[\^$+\-*/|()\[\]{}<>.,?!_=&@~%#:;'"]/.test(password);
    const hasSpace = /\s/.test(password);

    return lengthOk && hasUpper && hasLower && hasNumber && hasSymbol && !hasSpace;
  }

  /** zxcvbn強度チェック */
  static isStrong(password: string, email?: string, requiredScore: number = 3): boolean {
    const result = zxcvbn(password, this.buildUserInputs(email));
    return result.score >= requiredScore;
  }

  /** パスワード強度取得 */
  static getStrength(password: string, email?: string) {
    return zxcvbn(password, this.buildUserInputs(email));
  }

  /** ASCII以外除去 */
  static sanitize(value: string): string {
    return value.replace(/[^\x20-\x7E]/g, '');
  }
}
