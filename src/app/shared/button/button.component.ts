import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgIf, NgClass, RouterLink,
    IconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {

  @Input() label?: string;
  @Input() icon?: string;

  @Input() routerLink?: string | any[];
  @Input() queryParams?: any;
  @Input() state?: any;

  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() color: 'blue' | 'gray' | 'red' | 'yellow' | 'green' | 'teal' = 'blue';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() block = false;

  get buttonClasses() {
    return [
      `btn-${this.color}`,
      `btn-${this.size}`,
      this.block ? 'btn-block' : ''
    ];
  }

  
}