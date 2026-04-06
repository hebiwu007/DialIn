/**
 * DialIn — Color Picker (no numeric display)
 */
class ColorPickerController {
  constructor() { this.h = 180; this.s = 80; this.b = 90; }

  bind() {
    this.sliderH = document.getElementById('slider-h');
    this.sliderS = document.getElementById('slider-s');
    this.sliderB = document.getElementById('slider-b');
    this.preview = document.getElementById('color-preview');
    if (!this.sliderH) return;
    const update = () => this._update();
    this.sliderH.addEventListener('input', update);
    this.sliderS.addEventListener('input', update);
    this.sliderB.addEventListener('input', update);
  }

  reset(h, s, b) {
    this.h = h || 180; this.s = s !== undefined ? s : 80; this.b = b !== undefined ? b : 90;
    if (this.sliderH) { this.sliderH.value = this.h; this.sliderS.value = this.s; this.sliderB.value = this.b; }
    this._update();
  }

  getColor() { return { h: this.h, s: this.s, b: this.b }; }

  getCssColor(h, s, b) {
    const rgb = hsbToRgb(h ?? this.h, s ?? this.s, b ?? this.b);
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }

  _update() {
    this.h = parseInt(this.sliderH.value);
    this.s = parseInt(this.sliderS.value);
    this.b = parseInt(this.sliderB.value);
    this.preview.style.backgroundColor = this.getCssColor();
    const fullSat = this.getCssColor(this.h, 100, this.b);
    const gray = this.getCssColor(this.h, 0, this.b);
    this.sliderS.style.background = `linear-gradient(to right, ${gray}, ${fullSat})`;
    const bright = this.getCssColor(this.h, this.s, 100);
    this.sliderB.style.background = `linear-gradient(to right, #000000, ${bright})`;
  }
}
const colorPicker = new ColorPickerController();
