import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  description?: string;
  className?: string;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

export default function FileUpload({ 
  accept = ".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg",
  maxSize = 50,
  onFileSelect,
  placeholder = "Drop your document here or click to upload",
  description = "Supports PDF, DOCX, PPTX, XLSX, Images (up to 50MB)",
  className = ""
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const newFile: UploadedFile = {
        file,
        progress: 0,
        status: 'uploading',
        id: fileId
      };

      setUploadedFiles(prev => [...prev, newFile]);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            const newProgress = Math.min(f.progress + 10, 100);
            return {
              ...f,
              progress: newProgress,
              status: newProgress === 100 ? 'completed' : 'uploading'
            };
          }
          return f;
        }));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        if (onFileSelect) {
          onFileSelect(file);
        }
      }, 2000);
    });
  }, [maxSize, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => {
      acc[type.trim()] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    multiple: false
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
            <p className="text-gray-600 mb-2">{placeholder}</p>
            <p className="text-sm text-gray-500 mb-4">{description}</p>
            <Button variant="outline" className="hover:bg-primary hover:text-white">
              Choose File
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <File className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {uploadedFile.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {uploadedFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadedFile.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={uploadedFile.progress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
