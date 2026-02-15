import { Component } from '@angular/core';
import { EmployeeEditComponent } from '../../components/employee-edit/employee-edit.component';
import { IconComponent } from '../../../../shared/icon/icon.component';

@Component({
  selector: 'app-employee-edit-page',
  standalone: true,
  imports: [EmployeeEditComponent, IconComponent],
  templateUrl: './employee-edit-page.component.html'
})
export class EmployeeEditPageComponent {

}
