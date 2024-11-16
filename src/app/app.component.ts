import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  imageUrl: string | null = null;
  blurredImageUrl: string | null = null;
  isProcessing = false;
  blurAmount = 100; // Default blur amount
  private deferredPrompt: any;
  showInstallButton = false;

  constructor() {
    this.handleInstallPrompt();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.isProcessing = true;
      this.imageUrl = await this.readFile(file);
      await this.processImage();
      this.isProcessing = false;
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.isProcessing = true;
      this.imageUrl = await this.readFile(file);
      await this.processImage();
      this.isProcessing = false;
    }
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  async processImage() {
    if (this.imageUrl) {
      this.blurredImageUrl = await this.applyBlur(this.imageUrl);
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  private isSafari(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  }

  private applyBlur(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const aspectRatio = img.width / img.height;
        const targetWidth = 1920;
        const targetHeight = Math.round(targetWidth / aspectRatio);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (this.isSafari()) {
          // Calculate scale factors based on blur amount
          let blurFactor = this.blurAmount / 100; // Normalize to 0-1
          const baseScale = 0.4;
          
          const createBlurPass = (scale: number) => {
            const temp = document.createElement('canvas');
            const tempCtx = temp.getContext('2d')!;
            // Adjust scale based on blur amount
            const adjustedScale = scale * (1 - (blurFactor * 0.48));
            temp.width = canvas.width * adjustedScale;
            temp.height = canvas.height * adjustedScale;
            return { canvas: temp, ctx: tempCtx };
          };

          const pass1 = createBlurPass(baseScale);
          const pass2 = createBlurPass(baseScale * 0.5);
          const pass3 = createBlurPass(baseScale * 0.25);

          // Draw initial image at different scales
          pass1.ctx.drawImage(img, 0, 0, pass1.canvas.width, pass1.canvas.height);
          pass2.ctx.drawImage(img, 0, 0, pass2.canvas.width, pass2.canvas.height);
          pass3.ctx.drawImage(img, 0, 0, pass3.canvas.width, pass3.canvas.height);

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Adjust layer opacities based on blur amount
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.7 * blurFactor;
          ctx.drawImage(pass3.canvas, 0, 0, canvas.width, canvas.height);

          ctx.globalAlpha = 0.6 * blurFactor;
          ctx.drawImage(pass2.canvas, 0, 0, canvas.width, canvas.height);

          ctx.globalAlpha = Math.max(0.2, 0.5 * (1 - blurFactor));
          ctx.drawImage(pass1.canvas, 0, 0, canvas.width, canvas.height);

          // Adjust vibrancy based on blur amount
          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = 0.2 * (1 - blurFactor * 0.5);
          ctx.drawImage(pass1.canvas, 0, 0, canvas.width, canvas.height);

          // Final enhancement with reduced intensity for stronger blur
          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = Math.max(0.1, 0.3 * (1 - blurFactor));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          // Original approach for other browsers
          ctx.filter = `blur(${this.blurAmount}px)`;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          ctx.globalCompositeOperation = 'source-over';
          ctx.filter = `blur(${this.blurAmount * 0.8}px) brightness(1.2) contrast(1.3)`;
          ctx.globalAlpha = 0.4;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = 0.1;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = imageUrl;
    });
  }

  private handleInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton = true;
    });

    window.addEventListener('appinstalled', () => {
      this.showInstallButton = false;
      this.deferredPrompt = null;
    });
  }

  async installPwa() {
    if (!this.deferredPrompt) return;
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.showInstallButton = false;
    }
    
    this.deferredPrompt = null;
  }

  downloadImage() {
    if (this.blurredImageUrl) {
      const link = document.createElement('a');
      link.href = this.blurredImageUrl;
      link.download = 'blurred.jpg';
      link.click();
    }
  }

  reset() {
    this.imageUrl = null;
    this.blurredImageUrl = null;
    this.blurAmount = 100;
  }
}
