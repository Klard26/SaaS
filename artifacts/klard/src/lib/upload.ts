import { useRequestUploadUrl } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function publicUrlForObjectPath(objectPath: string): string {
  if (!objectPath) return "";
  if (/^https?:\/\//.test(objectPath)) return objectPath;
  if (objectPath.startsWith("/objects/")) {
    return `${basePath}/api/storage${objectPath}`;
  }
  return objectPath;
}

export function useFileUploader() {
  const requestUrl = useRequestUploadUrl();

  async function upload(file: File): Promise<string> {
    const { uploadURL, objectPath } = await requestUrl.mutateAsync({
      data: { name: file.name, size: file.size, contentType: file.type || "application/octet-stream" },
    });
    const putResp = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!putResp.ok) {
      throw new Error(`Upload fehlgeschlagen (${putResp.status})`);
    }
    return objectPath;
  }

  return { upload, isUploading: requestUrl.isPending };
}
