import { makeTextures } from '../util.js';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    makeTextures(this);
    this.scene.start('Menu');
  }
}
