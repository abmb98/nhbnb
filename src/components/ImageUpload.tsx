import React, { useState, useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  placeholder = "اختر صورة أو أدخل رابط",
  className = ""
}) => {
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    onImageChange(url);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const clearImage = () => {
    setImageUrl('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Method Toggle */}
      <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setUploadMethod('url')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            uploadMethod === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          رابط الصورة
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod('file')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            uploadMethod === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          رفع ملف
        </button>
      </div>

      {/* URL Input */}
      {uploadMethod === 'url' && (
        <div>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* File Upload */}
      {uploadMethod === 'file' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              اسحب الصورة هنا أو انقر للاختيار
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF حتى 10MB
            </p>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imageUrl && (
        <div className="relative">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={imageUrl}
                alt="معاينة"
                className="h-12 w-12 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">تم تحديد الصورة</p>
                <p className="text-xs text-gray-500">
                  {uploadMethod === 'url' ? 'من رابط' : 'من الجهاز'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Default Image Placeholder */}
      {!imageUrl && (
        <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
          <div className="text-center">
            <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{placeholder}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;