import { supabase } from '../lib/supabase';

export interface ServiceImage {
  id: string;
  url: string;
  path: string;
  fileName: string;
  uploadedAt: string;
}

export class ImageService {
  private static readonly BUCKET_NAME = 'service-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo 5MB.' };
    }

    return { isValid: true };
  }

  static async uploadServiceImages(orderId: number, files: File[]): Promise<ServiceImage[]> {
    const uploadPromises = files.map(async (file) => {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `orders/${orderId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('order_images')
        .insert({
          order_id: orderId,
          image_url: urlData.publicUrl,
          image_path: filePath
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: dbData.id,
        url: urlData.publicUrl,
        path: filePath,
        fileName: file.name,
        uploadedAt: dbData.created_at
      };
    });

    return Promise.all(uploadPromises);
  }

  static async getOrderImages(orderId: number): Promise<ServiceImage[]> {
    const { data, error } = await supabase
      .from('order_images')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(img => ({
      id: img.id,
      url: img.image_url,
      path: img.image_path,
      fileName: img.image_path.split('/').pop() || '',
      uploadedAt: img.created_at
    }));
  }

  static async deleteImage(imageId: string, imagePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([imagePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('order_images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;
  }

  static async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}