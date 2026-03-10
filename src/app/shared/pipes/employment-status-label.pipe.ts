import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'employmentStatusLabel',
  standalone: true
})
export class EmploymentStatusLabelPipe implements PipeTransform {

  transform(status: string): string {

    switch (status) {
      case 'EMPLOYED':
        return '在職';
      case 'SUSPENDED':
        return '休職';
      case 'RETIRED':
        return '退職';
      default:
        return status;
    }

  }

}