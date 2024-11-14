import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Blur';
  imageUrl: string | null = null;
  blurredImageUrl: string | null = null;
  isProcessing = false;

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
      this.blurredImageUrl = await this.applyBlur(this.imageUrl);
      this.isProcessing = false;
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
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.filter = 'blur(10px)';
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.src = imageUrl;
    });
  }

  downloadImage() {
    if (this.blurredImageUrl) {
      const link = document.createElement('a');
      link.href = this.blurredImageUrl;
      link.download = 'blurred-image.jpg';
      link.click();
    }
  }
}
