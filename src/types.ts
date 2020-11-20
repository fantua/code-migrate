import type { File } from './File';
import type {
  CreateTask,
  DeleteTask,
  RenameFn,
  RenameTask,
  TransformFn,
  TransformTask,
} from './tasks';

export type Pattern = string;

export type CreateReturnValue = { fileName: string; source: string };

export type CreateFn = () => CreateReturnValue;

export type RunMigration = () => void;

export type Options = { cwd: string };

export type TaskType = 'transform' | 'rename' | 'delete' | 'create';

export type Task = TransformTask | RenameTask | DeleteTask | CreateTask;

export type RegisterTransformTask = (
  title: string,
  pattern: Pattern,
  transformFn: TransformFn
) => void;

export type RegisterRenameTask = (
  title: string,
  pattern: Pattern,
  renameFn: RenameFn
) => void;

export type RegisterDeleteTask = (title: string, pattern: Pattern) => void;

export type RegisterCreateTask = (title: string, createFn: CreateFn) => void;

export type FileAction =
  | {
      type: 'transform';
      originalFile: File;
      newFile: File;
    }
  | {
      type: 'rename';
      originalFilePath: string;
      newFilePath: string;
    }
  | {
      type: 'delete';
      filePath: string;
    }
  | {
      type: 'create';
      originalFile?: File;
      newFile: File;
    };