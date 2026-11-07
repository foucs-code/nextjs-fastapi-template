"use client"
import React,{useState} from 'react';
import { Upload,FileText,CheckCircle2,AlertCircle,Loader2 } from 'lucide-react';
import { uploadWords } from "@/components/actions/upload-action"

export default function UploadPage() {
  const [file,setFile] = useState<File | null>(null);
  const [uploading,setUploading] = useState(false);
  const [status,setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage,setErrorMessage] = useState('');

  //处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
    if(e.target.files && e.target.files[0]){
      const selectedFile = e.target.files[0];
      if(selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')){
        setStatus('error');
        setErrorMessage('请上传正确的 CSV 格式文件');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  //处理上传动作
  const handleUpload = async () => {
  if (!file) return;

  setUploading(true);
  setStatus("idle");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const result = await uploadWords(formData);

    if ("error" in result) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }

    setStatus("success");
    setFile(null);
  } catch {
    setStatus("error");
    setErrorMessage("上传发生未知错误");
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
            上传单词
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            文件格式 CSV
          </p>
        </header>

        {/* 上传卡片区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          
          {/* 拖拽/选择上传区域 */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center space-y-3">
              <Upload className="w-10 h-10 text-gray-400" />
              <div className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">点击上传</span> 或将文件拖拽到此处
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500">仅支持 .csv 格式文件</p>
            </div>
          </div>

          {/* 已选择文件的预览展示 */}
          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-500 hover:underline"
              >
                移除
              </button>
            </div>
          )}

          {/* 状态提示 */}
          {status === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              <CheckCircle2 className="w-5 h-5" />
              <span>单词文件上传并解析成功！</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center space-x-2 ${
              !file || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
            }`}
          >
            {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{uploading ? '正在上传中...' : '确认上传'}</span>
          </button>

        </div>
      </div>
    </div>
    
  );
}
