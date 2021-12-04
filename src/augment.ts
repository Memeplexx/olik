import { augmentations } from './constant';
import { Augmentations } from './type';

export function augment(arg: Partial<Augmentations>) {
  Object.assign(augmentations, arg);
}
