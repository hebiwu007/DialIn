/**
 * DialIn — Color Picker Controller
 */
class ColorPickerController {
  constructor() {
    this.h = 180;
    this.s = 80;
    this.b = 90;
    this.onChange = null;
    this._bound = false;
  }

  bind() {
    this.sliderH = document.getElementById('slider-h');
    this.sliderS = document.getElementById('slider-s');
    this.sliderB = document.getElementById('slider-b');
    this.valueH = document.getElementById('value-h');
    this.valueS = document.getElementById('value-s');
    this.valueB = document.getElementById('value-b');
    this.preview = document.getElementById('color-preview');

    if (this._bound) return;
    this._bound = true;

    const update = () => this._update();
    this.sliderH.addEventListener('input', update);
    this.sliderS.addEventListener('input', update);
    this.sliderB.addEventListener('input', update);
  }

  reset(h, s, b) {
    this.h = h || 180;
    this.s = s !== undefined ? s : 80;
    this.b = b !== undefined ? b : 90;
    if (this.sliderH) {
      this.sliderH.value = this.h;
      this.sliderS.value = this.s;
      this.sliderB.value = this.b;
    }
    this._update();
  }

  getColor() {
    return { h: this.h, s: this.s, b: this.b };
  }

  getCssColor(h, s, b) {
    const rgb = hsbToRgb(h || this.h, s !== undefined ? s : this.s, b !== undefined ? b : this.b);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  _update() {
    this.h = parseInt(this.sliderH.value);
    this.s = parseInt(this.sliderS.value);
    this.b = parseInt(this.sliderB.value);

    // Update value labels
    this.valueH.textContent = this.h + '°';
    this.valueS.textContent = this.s + '%';
    this.valueB.textContent = this.b + '%';

    // Update preview
    this.preview.style.backgroundColor = this.getCssColor();

    // Update saturation track (gray → vivid)
    const fullSatColor = this.getCssColor(this.h, 100, this.b);
    const grayColor = this.getCssColor(this.h, 0, this.b);
    this.sliderS.style.background = `linear-gradient(to right, ${grayColor}, ${fullSatColor})`;

    // Update brightness track (black → bright)
    const brightColor = this.getCssColor(this.h, this.s, 100);
    this.sliderB.style.background = `linear-gradient(to right, #000000, ${brightColor})`;

    // Callback
    if (this.onChange) this.onChange(this.getColor());
  }
}

const colorPicker = new ColorPickerController();
