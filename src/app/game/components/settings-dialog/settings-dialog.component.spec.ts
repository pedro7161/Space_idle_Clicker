import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsDialogComponent } from './settings-dialog.component';
import { Component } from '@angular/core';
import { SupportedLocale } from '../../i18n/game-messages';

@Component({
  standalone: true,
  imports: [SettingsDialogComponent],
  template: `
    <app-settings-dialog
      [exportCode]="exportCode"
      [exportFileContents]="exportFileContents"
      [currentLocale]="currentLocale"
      [localeOptions]="localeOptions"
      [devModeEnabled]="devModeEnabled"
    />
  `,
})
class TestHostComponent {
  exportCode = 'test-export-code';
  exportFileContents = '{"test": true}';
  currentLocale: SupportedLocale = 'en';
  devModeEnabled = true;
  localeOptions = [
    { id: 'en' as const, label: 'English' },
    { id: 'pt' as const, label: 'Português (Portugal)' },
    { id: 'pt-BR' as const, label: 'Português (Brasil)' },
    { id: 'es' as const, label: 'Español' },
    { id: 'fr' as const, label: 'Français' },
  ];
}

describe('SettingsDialogComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let component: SettingsDialogComponent;

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

  it('should receive export code via input', () => {
    expect(component.exportCode()).toBe('test-export-code');
  });

  it('should receive export file contents via input', () => {
    expect(component.exportFileContents()).toBe('{"test": true}');
  });

  it('should receive current locale via input', () => {
    expect(component.currentLocale()).toBe('en');
  });

  it('should start with empty import value', () => {
    expect(component.importValue).toBe('');
  });

  it('should start with no feedback', () => {
    expect(component.feedbackMessage).toBe('');
    expect(component.feedbackTone).toBe('neutral');
  });

  it('should update feedback via public method', () => {
    component.updateFeedback('Import successful!', 'success');
    expect(component.feedbackMessage).toBe('Import successful!');
    expect(component.feedbackTone).toBe('success');
  });

  it('should update feedback to error', () => {
    component.updateFeedback('Something went wrong', 'error');
    expect(component.feedbackMessage).toBe('Something went wrong');
    expect(component.feedbackTone).toBe('error');
  });

  it('should emit importRequested when requestImportCode is called', () => {
    spyOn(component.importRequested, 'emit');
    component.importValue = 'some-save-data';
    component.requestImportCode();
    expect(component.importRequested.emit).toHaveBeenCalledWith('some-save-data');
  });

  it('should emit localeChanged when onLocaleChange is called', () => {
    spyOn(component.localeChanged, 'emit');
    component.onLocaleChange('pt-BR');
    expect(component.localeChanged.emit).toHaveBeenCalledWith('pt-BR');
  });

  it('should emit devGrantRequested when a valid dev grant is requested', () => {
    spyOn(component.devGrantRequested, 'emit');
    component.devGrantAmount = 1500;

    component.requestDevGrant('currentPlanet');

    expect(component.devGrantRequested.emit).toHaveBeenCalledWith({
      amount: 1500,
      scope: 'currentPlanet',
    });
  });

  it('should show feedback instead of emitting when dev grant amount is invalid', () => {
    spyOn(component.devGrantRequested, 'emit');
    component.devGrantAmount = 0;

    component.requestDevGrant('allPlanets');

    expect(component.devGrantRequested.emit).not.toHaveBeenCalled();
    expect(component.feedbackTone).toBe('error');
  });

  it('should render dev tools when dev mode is enabled', () => {
    const nativeElement = hostFixture.nativeElement as HTMLElement;

    expect(nativeElement.textContent).toContain(component.copy.messages.ui.settingsDialog.devToolsTitle);
  });

  it('should hide dev tools when dev mode is disabled', () => {
    hostFixture.componentInstance.devModeEnabled = false;
    hostFixture.detectChanges();

    const nativeElement = hostFixture.nativeElement as HTMLElement;
    expect(nativeElement.textContent).not.toContain(component.copy.messages.ui.settingsDialog.devToolsTitle);
  });

  it('should emit resetRequested output', () => {
    spyOn(component.resetRequested, 'emit');
    component.resetRequested.emit();
    expect(component.resetRequested.emit).toHaveBeenCalled();
  });

  it('should emit changelogRequested output', () => {
    spyOn(component.changelogRequested, 'emit');
    component.changelogRequested.emit();
    expect(component.changelogRequested.emit).toHaveBeenCalled();
  });

  it('should emit closed output', () => {
    spyOn(component.closed, 'emit');
    component.closed.emit();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  describe('exportSaveFile', () => {
    it('should create and click a download link', () => {
      const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
      const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      const clickSpy = jasmine.createSpy('click');
      spyOn(document, 'createElement').and.returnValue({ click: clickSpy, href: '', download: '' } as any);

      component.exportSaveFile();

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
    });
  });
});
