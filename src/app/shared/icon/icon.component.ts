import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule, NgIf],
  template: `
    <lucide-icon
      *ngIf="name"
      [name]="name"
      class="app-icon">
    </lucide-icon>
  `,
  styleUrls: ['./icon.component.scss']
})
export class IconComponent {

  @Input() name!: string;

}