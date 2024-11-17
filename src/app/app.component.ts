import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as StackBlur from 'stackblur-canvas';

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
  
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        StackBlur.canvasRGB(canvas, 0, 0, canvas.width, canvas.height, this.blurAmount);
  
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
