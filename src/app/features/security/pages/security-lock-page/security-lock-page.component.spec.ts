import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityLockPageComponent } from './security-lock-page.component';

describe('SecurityLockPageComponent', () => {
  let component: SecurityLockPageComponent;
  let fixture: ComponentFixture<SecurityLockPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityLockPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SecurityLockPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
