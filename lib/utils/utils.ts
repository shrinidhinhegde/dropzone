import {getPreSignedURL} from "@/lib/utils/preSignedURL";

interface UploadParams {
  file: Buffer | Blob;
  destinationPath: string;
  signal: AbortSignal;
  onProgress: (progress: number) => void;
}

export const uploadFileToS3 = async ({ file, destinationPath, signal, onProgress }: UploadParams) => {
  const url = await getPreSignedURL(destinationPath);
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', url, true);
  xhr.setRequestHeader('Content-Type', 'text/plain');
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const progress = (event.loaded / event.total) * 100;
      console.log(progress);
      onProgress(progress);
    }
  };
  xhr.send(file);
  signal.addEventListener('abort', () => {
    xhr.abort();
  });
};