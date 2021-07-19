import { Augmentations } from './shapes-external';

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  async: promise => promise(),
};

export function augment(arg: Partial<Augmentations>) {
  Object.assign(augmentations, arg);
}
