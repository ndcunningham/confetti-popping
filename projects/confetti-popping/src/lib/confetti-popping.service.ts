import { Injectable } from '@angular/core';
import { Options } from 'canvas-confetti';
import * as confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root'
})
export class ConfettiPoppingService {

  canvasStyles = `
  position: fixed;
  top:0;
  z-index:200;
  width:100vw;
  height:100vh;
  -ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
  filter: alpha(opacity=50);
  -moz-opacity:0.5;
  -khtml-opacity: 0.5;
  opacity: 1;
  pointer-events: none;
  `;

  private canvas: HTMLCanvasElement;
  private confettiActive = false;

  private conffetiTiming: Array<number> = [750, 950, 1200];
  private colors: Array<Array<string>> = [
    ['#FF443A', '#7FD3FF', '#FFD646', '#B872FF'],
    // ['#FFA447', '#6586FF', '#40F383', '#FFDC61'],
    ['#31ECF2', '#FF443A', '#FF5CED', '#FFD646'],
  ];
  private confettiArray: Array<Promise<any>> = [];
  private endTimeout: any;

  constructor() {}

  makeFireworks(
    duration = 10,
    colors?: [Array<string>],
    timing?: Array<number>
  ): Promise<any> {
    if (this.confettiActive) return;

    this.confettiActive = true;
    this.setParams(colors, timing);

    const end = duration * 1000;
    const confettiCanvas = confetti.create(this.addCanvas(), { resize: true });

    for (let i = 0; i < this.colors.length; i++) {
      if (this.confettiArray) {
        this.confettiArray.push(
          this.createConfetti(
            confettiCanvas,
            this.conffetiTiming[i],
            this.colors[i]
          )
        );
      }
    }

    this.endTimeout = timeout(end);

    this.endTimeout
      .then(int => {
        this.destroyConfetti();
      })
      .catch(err => {
        console.warn('ConfettiService deleted with error:: ', err);
        this.destroyConfetti();
      });

    return this.endTimeout;
  }

  cancelConfetti() {
    if (!this.endTimeout) return;
    this.endTimeout.cancel();
  }

  destroyConfetti(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.canvas) {
        this.confettiActive = false;

        resolve(
          Promise.all(this.confettiArray).then(ids => {
            this.confettiArray = [];
            if (this.canvas !== undefined) {
              document.body.removeChild(this.canvas);
              this.canvas = undefined;
            }
          })
        );
      } else {
        resolve(true);
      }
    });
  }

  private getConfettiOptions(colors?: Array<string>): Options {
    return {
      startVelocity: 20,
      spread: Math.random() * (4500 - 2000) + 2000,
      ticks: 75,
      colors,
      particleCount: Math.random() * (50 - 25) + 25,
      origin: {
        x: Math.random() / 2 + 0.25,
        // since they fall down, start a bit higher than random
        y: Math.random() / 2 + Math.random() / 4,
      },
    };
  }

  private setParams(colors?: [Array<string>], timing?: Array<number>) {
    if (colors) {
      this.colors = colors;
    }

    if (timing) {
      this.conffetiTiming = timing;
    }
  }

  /**
   * createConfetti
   * returns a confetti instance wrapped in a interval
   * promise resolves confetti instance and interval resolve
   */
  private createConfetti(canvas, time: number, color?: Array<string>) {
    return new Promise(resolve => {
      let interval = setInterval(() => {
        const confettiPromise = canvas(this.getConfettiOptions(color));

        if (!this.confettiActive) {
          clearInterval(interval);
          resolve(confettiPromise);
        }
      }, time);
    });
  }

  /**
   * addCanvas
   * @returns confetti canvas element
   * will not create a confetti canvas if one is still present on screen
   */
  private addCanvas(): HTMLCanvasElement {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'effect_confetti');
    this.canvas.setAttribute('style', this.canvasStyles);

    const body: HTMLElement = document.getElementsByTagName('body')[0];
    body.insertBefore(this.canvas, body.firstChild);

    return this.canvas;
  }
}

// huge heckin work around to get a cancel-able timeout
// -_-"
function timeout(ms) {
  let endTimer: Function, timerId: number;

  class Timer extends Promise<any> {
    isCanceled = false;

    constructor(fn) {
      super(fn);
    }

    cancel() {
      endTimer('timer cancelled');
      clearTimeout(timerId);
      this.isCanceled = true;
    }
  }

  return new Timer(resolve => {
    endTimer = resolve;
    timerId = setTimeout(endTimer, ms);
  });
}
