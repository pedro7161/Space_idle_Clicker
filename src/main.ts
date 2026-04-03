import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { migrateLegacySaveKeys } from './app/game/storage/game-save';

try {
  migrateLegacySaveKeys();
} catch (error) {
  console.warn('Failed to migrate legacy save data.', error);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
