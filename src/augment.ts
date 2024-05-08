import { augmentations } from './constant';
import { Augmentations, ValidJsonObject } from './type';

export function augment(arg: Partial<Augmentations>) {
  // Object.assign(augmentations, arg);
  (Object.keys(augmentations) as Array<keyof typeof augmentations>).forEach(key => {
    const el = arg[key] as ValidJsonObject;
    if (!el) {
      return;
    } else if (typeof el === 'function') {
      augmentations[key] = el;
    } else {
      Object.assign(augmentations[key], el);
    }
  });
}
