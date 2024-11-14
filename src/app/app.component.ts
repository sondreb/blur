import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Blur';
  imageUrl: string | null = null;
  blurredImageUrl: string | null = null;
  isProcessing = false;
  blurAmount = 100;  // Default blur amount

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
        
        // First pass - extreme blur
        ctx.filter = `blur(${this.blurAmount}px)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Third pass - very soft overlay of original
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = `blur(${this.blurAmount * 0.8}px) brightness(1.2) contrast(1.3)`;
        ctx.globalAlpha = 0.4;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Fourth pass - additional color vibrancy
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = imageUrl;
    });
  }

  downloadImage() {
    if (this.blurredImageUrl) {
      const link = document.createElement('a');
      link.href = this.blurredImageUrl;
      link.download = 'wallpaper.jpg';
      link.click();
    }
  }
}
