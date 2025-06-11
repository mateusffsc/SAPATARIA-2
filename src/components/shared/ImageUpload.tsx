import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Eye } from 'lucide-react';
import { ImageService, ServiceImage } from '../../services/imageService';

interface ImageUploadProps {
  orderId?: number;
  existingImages?: ServiceImage[];
  onImagesChange?: (images: ServiceImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  orderId,
  existingImages = [],
  onImagesChange,
  maxImages = 10,
  disabled = false
}) => {
  const [images, setImages] = useState<ServiceImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if we would exceed max images
    if (images.length + files.length > maxImages) {
      alert(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    setUploading(true);

    try {
      // Compress images before upload
      const compressedFiles = await Promise.all(
        files.map(file => ImageService.compressImage(file))
      );

      if (orderId) {
        // Upload to server
        const uploadedImages = await ImageService.uploadServiceImages(orderId, compressedFiles);
        const newImages = [...images, ...uploadedImages];
        setImages(newImages);
        onImagesChange?.(newImages);
      } else {
        // Create preview URLs for new images
        const previewImages: ServiceImage[] = compressedFiles.map((file, index) => ({
          id: `preview-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          path: '',
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        }));
        
        const newImages = [...images, ...previewImages];
        setImages(newImages);
        onImagesChange?.(newImages);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageId: string, imagePath: string) => {
    try {
      if (orderId && imagePath) {
        await ImageService.deleteImage(imageId, imagePath);
      }
      
      const newImages = images.filter(img => img.id !== imageId);
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Erro ao remover imagem');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Fotos do Serviço ({images.length}/{maxImages})
        </label>
        
        {images.length < maxImages && !disabled && (
          <button
            type="button"
            onClick={openFileDialog}
            disabled={uploading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Enviando...' : 'Adicionar Fotos'}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Images grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(image.url)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id, image.path)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                      title="Remover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Image info */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 truncate">{image.fileName}</p>
                <p className="text-xs text-gray-400">
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Nenhuma foto adicionada</p>
          <p className="text-sm text-gray-400">
            Adicione até {maxImages} fotos do serviço
          </p>
        </div>
      )}

      {/* Image preview modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;