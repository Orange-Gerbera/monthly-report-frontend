import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleLabel',
  standalone: true
})
export class RoleLabelPipe implements PipeTransform {

  transform(role: string): string {

    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'システム管理者';
      case 'ADMIN':
        return '管理者';
      case 'GENERAL':
        return '一般';
      default:
        return role;
    }

  }

}