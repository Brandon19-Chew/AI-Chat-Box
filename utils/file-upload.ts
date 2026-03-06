import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export interface FileData {
  uri: string;
  fileName: string;
  fileType: "image" | "text" | "file";
  mimeType: string;
  fileSize: number;
  base64?: string;
  content?: string;
}

/**
 * Pick a file (text, image, or any document) from device storage
 * Note: File picking disabled to reduce native dependencies
 */
export async function pickFile(): Promise<FileData | null> {
  console.warn("File picking is currently disabled");
  return null;
}

/**
 * Pick an image from device camera or gallery
 * Note: Image picking disabled to reduce native dependencies
 */
export async function pickImage(): Promise<FileData | null> {
  console.warn("Image picking is currently disabled");
  return null;
}

/**
 * Read file content as text (for text files)
 */
export async function readTextFile(fileUri: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      const response = await fetch(fileUri);
      return await response.text();
    } else {
      const content = await FileSystem.readAsStringAsync(fileUri);
      return content;
    }
  } catch (error) {
    console.error("Error reading text file:", error);
    return null;
  }
}

/**
 * Read file as base64
 */
export async function readFileAsBase64(fileUri: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1] || "";
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "base64",
      } as any);
      return base64;
    }
  } catch (error) {
    console.error("Error reading file as base64:", error);
    return null;
  }
}

/**
 * Upload file to server and get URL
 */
export async function uploadFileToServer(
  fileData: FileData,
  content?: string
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("fileName", fileData.fileName);
    formData.append("fileType", fileData.fileType);
    formData.append("mimeType", fileData.mimeType);
    formData.append("fileSize", fileData.fileSize.toString());

    if (content) {
      formData.append("content", content);
    }

    if (fileData.base64) {
      formData.append("base64", fileData.base64);
    }

    if (Platform.OS !== "web") {
      const response = await fetch(fileData.uri);
      const blob = await response.blob();
      formData.append("file", blob, fileData.fileName);
    } else {
      const response = await fetch(fileData.uri);
      const blob = await response.blob();
      formData.append("file", blob, fileData.fileName);
    }

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const data = await uploadResponse.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

/**
 * Process file and prepare for sending to AI
 */
export async function processFileForAI(
  fileData: FileData
): Promise<{ content: string; mimeType: string } | null> {
  try {
    if (fileData.fileType === "text") {
      const content = await readTextFile(fileData.uri);
      if (content) {
        return {
          content,
          mimeType: fileData.mimeType,
        };
      }
    } else if (fileData.fileType === "image") {
      const base64 = fileData.base64 || (await readFileAsBase64(fileData.uri));
      if (base64) {
        return {
          content: base64,
          mimeType: fileData.mimeType,
        };
      }
    } else {
      const base64 = await readFileAsBase64(fileData.uri);
      if (base64) {
        return {
          content: base64,
          mimeType: fileData.mimeType,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error processing file for AI:", error);
    return null;
  }
}
