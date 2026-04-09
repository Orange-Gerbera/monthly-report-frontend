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

import {
  Component,
  forwardRef,
  Input,
  Provider,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

const SELECT_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectComponent),
  multi: true,
};

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [SELECT_VALUE_ACCESSOR],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() options: any[] = [];
  @Input() optionLabelFn?: string;
  @Input() valueFormat?: string;
  @Input() bindLabel: string = '';

  value: any;

  // ControlValueAccessor メソッド
  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // 任意：必要なら無効化対応
  }

  // optionが変更されたときに呼ぶ
  updateValue(newValue: any) {
    this.value = newValue;
    this.onChange(newValue);
    this.onTouched();
  }

  getOptionLabel(option: any): string {
    if (this.bindLabel) return option[this.bindLabel];
    if (this.optionLabelFn && typeof (this as any)[this.optionLabelFn] === 'function') {
      return (this as any)[this.optionLabelFn](option, this.valueFormat);
    }
    return option;
  }
}
