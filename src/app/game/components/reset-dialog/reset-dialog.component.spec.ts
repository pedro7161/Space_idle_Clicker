import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetDialogComponent } from './reset-dialog.component';

describe('ResetDialogComponent', () => {
  let fixture: ComponentFixture<ResetDialogComponent>;
  let component: ResetDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirmed when confirm button is clicked', () => {
    spyOn(component.confirmed, 'emit');
    const confirmBtn = fixture.nativeElement.querySelector('button');
    confirmBtn.click();
    expect(component.confirmed.emit).toHaveBeenCalled();
  });

  it('should emit cancelled when cancel button is clicked', () => {
    spyOn(component.cancelled, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelBtn = buttons[1];
    cancelBtn.click();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should emit cancelled when backdrop is clicked', () => {
    spyOn(component.cancelled, 'emit');
    const backdrop = fixture.nativeElement.querySelector('.fixed');
    backdrop.click();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should display the reset question message', () => {
    const questionEl = fixture.nativeElement.querySelector('p');
    expect(questionEl.textContent).toBeTruthy();
  });
});
