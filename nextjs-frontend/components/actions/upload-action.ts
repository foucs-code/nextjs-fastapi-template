"use server";

import { cookies } from "next/headers";
import { uploadWords as uploadWordsRequest } from "@/app/clientService";

type UploadWordsData = {
  filename: string;
  total_rows: number;
  valid_words: number;
  skipped: number;
  preview: string[];
};

type UploadResult =
  | { success: true; data: UploadWordsData }
  | { error: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadWords(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "请选择要上传的 CSV 文件" };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "只支持 .csv 文件" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "文件不能超过 5 MB" };
  }

  const token = (await cookies()).get("accessToken")?.value;
  if (!token) {
    return { error: "登录已过期，请重新登录" };
  }

  const { data, error } = await uploadWordsRequest({
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      file,
    },
  });

  if (error) {
    const detail = (error as { detail?: unknown }).detail;

    return {
      error:
        typeof detail === "string"
          ? detail
          : "上传失败，请检查文件内容或后端服务",
    };
  }

  if (!data) {
    return { error: "上传失败：服务端没有返回数据" };
  }

  return { success: true, data };
}