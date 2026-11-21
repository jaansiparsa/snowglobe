// Live frame-rate readout, refreshed twice a second.
export class FpsMeter {
  constructor(el) {
    this.el = el;
    this.acc = 0; this.n = 0; this.t = 0;
  }

  tick(dt, now, flakes) {
    this.acc += dt; this.n++;
    if (now - this.t > 500) {
      this.el.textContent = `${Math.round(this.n / this.acc)} fps · ${flakes.toLocaleString()} flakes`;
      this.acc = 0; this.n = 0; this.t = now;
    }
  }
}
