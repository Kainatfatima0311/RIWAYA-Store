import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const ASSET_BASE = API_BASE.replace(/\/api$/, '');

const absoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${ASSET_BASE}${url}`;
};

/**
 * Image uploader with file picker, preview, drag-drop, multiple files.
 *
 * Props:
 *   value: array of { url, publicId }  (current images)
 *   onChange: (newArray) => void
 *   category: subfolder ('products', 'equipment', etc.)
 *   max: maximum number of images (default 5)
 *   single: if true, only one image allowed (replaces existing)
 */
export function ImageUploader({ value = [], onChange, category = 'general', max = 5, single = false }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const images = Array.isArray(value) ? value : [];
  const limit = single ? 1 : max;
  const remaining = limit - images.length;

  const uploadFiles = async (files) => {
    const filesArr = Array.from(files);
    if (!filesArr.length) return;
    if (remaining <= 0 && !single) {
      toast.error(`Maximum ${limit} images allowed`);
      return;
    }

    const toUpload = single ? filesArr.slice(0, 1) : filesArr.slice(0, remaining);
    setUploading(true);

    try {
      const formData = new FormData();
      const endpoint = toUpload.length === 1 ? '/uploads/image' : '/uploads/images';
      const fieldName = toUpload.length === 1 ? 'image' : 'images';
      toUpload.forEach((file) => formData.append(fieldName, file));

      const token = localStorage.getItem('riwaya_token');
      const res = await fetch(`${API_BASE}${endpoint}/${category}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || 'Upload failed');

      const uploaded = Array.isArray(body.data) ? body.data : [body.data];
      const newImages = single ? uploaded : [...images, ...uploaded];
      onChange(newImages);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = (idx) => {
    const newImages = images.filter((_, i) => i !== idx);
    onChange(newImages);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Existing images preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
              <img src={absoluteUrl(img.url)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && !single && (
                <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {(single ? images.length === 0 : remaining > 0) && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={!single}
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-muted p-3">
                {images.length === 0 ? (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {single ? 'Click or drop image here' : `Add ${remaining} more image${remaining > 1 ? 's' : ''}`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WEBP, GIF · up to 5 MB each
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!single && images.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {images.length} of {limit} images · drag to reorder coming soon · first image is the primary one
        </p>
      )}
    </div>
  );
}
