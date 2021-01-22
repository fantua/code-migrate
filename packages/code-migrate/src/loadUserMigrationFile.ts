import { register as tsNodeRegister } from 'ts-node';
import importFresh from 'import-fresh';
import { Migration } from './Migration';
import type { Migrate } from './migrate';

/**
 *
 * @param migration migration instance
 * @param migrationFile An absolute path to the users migration file
 */
export const loadUserMigrationFile = (
  migration: Migration,
  migrationFile: string
) => {
  // Load user's migration file
  const migrate: Migrate = (title, fn) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Starting: ${title}`);
    }

    fn(migration.registerMethods, {
      ...migration.options,
      fs: migration.fs,
    });
  };

  // @ts-expect-error not sure how to type this
  globalThis.migrate = migrate;

  tsNodeRegister({
    transpileOnly: true,
  });

  if (typeof jest !== 'undefined') {
    jest.doMock('code-migrate', () => {
      return {
        __esModule: true,
        migrate,
      };
    });
  } else {
    require('mock-require')('code-migrate', {
      migrate,
    });
  }

  importFresh(migrationFile);
};
