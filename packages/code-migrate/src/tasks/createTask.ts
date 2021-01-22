import { File, getFiles } from '../File';
import { RunTask } from './runTask';
import { FileAction, Pattern } from '../types';
import { isTruthy } from '../utils';
import { isNull, isUndefined } from 'lodash';

export type CreateReturnValue = { source?: string; fileName?: string } | null;

export type EmptyCreateFn = () => CreateReturnValue;

export type CreateFn = ({
  fileName,
  source,
}: {
  fileName: string;
  source: string;
}) => CreateReturnValue;

export type CreateTask = {
  type: 'create';
  title: string;
  pattern?: Pattern;
  fn: CreateFn | EmptyCreateFn;
};

export const runCreateTask: RunTask<CreateTask> = (task, migration) => {
  if (!task.pattern) {
    return [createFile()].filter(isTruthy);
  }

  const files = getFiles(migration.options.cwd, task.pattern, migration);

  const fileResults: Array<FileAction> = files.map(createFile).filter(isTruthy);

  return fileResults;

  function createFile(file?: File): FileAction | null {
    migration.events.emit('create-start', { file, task });

    let createdFile: CreateReturnValue = {};

    try {
      if (file) {
        createdFile = task.fn({
          fileName: file.fileName,
          source: file.source,
        });
      } else {
        // @ts-expect-error we know that in this case, this is an EmptyCreateFn
        createdFile = task.fn();
      }
    } catch (error) {
      migration.events.emit('create-fail', {
        file,
        error,
        task,
      });

      return null;
    }

    if (isNull(createdFile)) {
      migration.events.emit('create-success-cancle', { task });
      return null;
    }

    if (!createdFile.fileName) {
      throw new Error(
        'the return value of a create function needs to contain an object with { fileName: <string> }'
      );
    }

    if (isUndefined(createdFile.source)) {
      throw new Error(
        'the return value of a create function needs to contain an object with { source: <string> }'
      );
    }

    const originalFile = new File({
      cwd: migration.options.cwd,
      fileName: createdFile.fileName,
      migration,
    });

    const newFile = new File({
      cwd: migration.options.cwd,
      fileName: createdFile.fileName,
      source: createdFile.source,
      migration,
    });

    const fileAction: FileAction = {
      newFile,
      type: task.type,
      task,
    };

    if (originalFile.exists) {
      // Add the original File to mark that the file exists

      fileAction.originalFile = originalFile;

      // @ts-expect-error - we know that originalFile exists here
      migration.events.emit('create-success-override', fileAction);
    }

    migration.events.emit('create-success', fileAction);

    migration.fs.writeFileSync(newFile.path, newFile.source);
    return fileAction;
  }
};
