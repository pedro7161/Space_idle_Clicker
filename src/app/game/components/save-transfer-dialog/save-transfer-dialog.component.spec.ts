import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaveTransferDialogComponent } from './save-transfer-dialog.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [SaveTransferDialogComponent],
  template: `<app-save-transfer-dialog [exportValue]="exportValue" />`,
})
class TestHostComponent {
  exportValue = 'test-save-code';
}

describe('SaveTransferDialogComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let component: SaveTransferDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    component = hostFixture.debugElement.children[0].componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive exportValue via input', () => {
    expect(component.exportValue()).toBe('test-save-code');
  });

  it('should start with empty import value', () => {
    expect(component.importValue).toBe('');
  });

  it('should start with no feedback', () => {
    expect(component.feedbackMessage).toBe('');
    expect(component.feedbackTone).toBe('neutral');
  });

  it('should emit importRequested with current importValue', () => {
    spyOn(component.importRequested, 'emit');
    component.importValue = 'some-import-data';
    component.requestImport();
    expect(component.importRequested.emit).toHaveBeenCalledWith('some-import-data');
  });

  it('should update feedback via public method', () => {
    component.updateFeedback('Imported!', 'success');
    expect(component.feedbackMessage).toBe('Imported!');
    expect(component.feedbackTone).toBe('success');
  });

  it('should update feedback to error', () => {
    component.updateFeedback('Failed!', 'error');
    expect(component.feedbackMessage).toBe('Failed!');
    expect(component.feedbackTone).toBe('error');
  });

  it('should emit closed output', () => {
    spyOn(component.closed, 'emit');
    component.closed.emit();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  describe('copyExport', () => {
    it('should set success feedback when clipboard succeeds', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      await component.copyExport();
      expect(component.feedbackTone).toBe('success');
      expect(component.feedbackMessage).toBeTruthy();
    });

    it('should set error feedback when clipboard fails', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject('denied'));
      await component.copyExport();
      expect(component.feedbackTone).toBe('error');
      expect(component.feedbackMessage).toBeTruthy();
    });
  });
});
