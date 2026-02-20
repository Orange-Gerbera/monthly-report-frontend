import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color:
    | 'blue'
    | 'gray'
    | 'red'
    | 'white'
    | 'green'
    | 'yellow'
    | 'teal' = 'blue';

  @Input() block: boolean = false;
  @Input() routerLink?: string | any[];
  @Input() queryParams?: { [key: string]: any };
  @Input() disabled: boolean = false;
  @Input() icon?: string;

  get buttonClasses(): string[] {
    return [
      'app-btn-' + this.color,
      this.size === 'sm'
        ? 'app-btn-sm'
        : this.size === 'lg'
        ? 'app-btn-lg'
        : '',
      this.block ? 'app-btn-block' : '',
      this.isIconOnly ? 'app-btn-icon-only' : '',
    ];
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  get iconPath(): string | null {
    return this.icon ? `assets/icons/${this.icon}.svg` : null;
  }

  get isIconOnly(): boolean {
    return !!this.icon && !this.label;
  }
}
