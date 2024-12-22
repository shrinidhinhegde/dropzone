import {useDropzone} from "react-dropzone";
import React, {ChangeEventHandler, FC, useCallback, useState} from "react";
import {UploadIcon, XIcon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {useFormContext} from "react-hook-form";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {uploadFileToS3} from "@/lib/utils/utils";

interface DropzoneFieldProps {
  name: string;
  filePathName: string;
  multiple?: boolean;
  destinationPathPrefix: string;
  description?: string;
}

export const DropzoneField: FC<DropzoneFieldProps> = ({
                                                        name,
                                                        filePathName,
                                                        multiple,
                                                        destinationPathPrefix,
                                                        description,
                                                        ...rest
                                                      }) => {
  const {setValue, getValues} = useFormContext();
  const files = getValues(name);
  const filePaths = getValues(filePathName);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [abortControllers, setAbortControllers] = useState<Record<string, AbortController>>({});

  const onDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (multiple) {
        const newFiles = (!!files?.length && [...files].concat(droppedFiles)) || droppedFiles;
        setValue(name, newFiles, {shouldValidate: true});
      } else {
        setValue(name, droppedFiles[0], {shouldValidate: true});
      }

      for (const file of droppedFiles) {
        const controller = new AbortController();
        setAbortControllers((prev) => ({...prev, [file.name]: controller}));
        const destinationPath = `${destinationPathPrefix.endsWith('/') ? destinationPathPrefix.slice(0, -1) : destinationPathPrefix}/${file.name}`;
        await uploadFileToS3({
          file,
          destinationPath,
          signal: controller.signal,
          onProgress: (progress) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
            if (progress === 100) {
              setValue(filePathName, { ...filePaths, [file.name]: destinationPath });
            }
          }
        });
      }
    },
    [multiple, files, setValue, name, destinationPathPrefix, filePathName, filePaths],
  );
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file_array = Array.from(e.target.files || []);
    await onDrop(file_array);
  }
  const handleCancelUpload = (fileName: string) => {
    if (multiple) {
      setValue(name, files.filter((f: File) => f.name !== fileName), {shouldValidate: true});
    } else {
      setValue(name, undefined, {shouldValidate: true});
    }
    if (abortControllers[fileName]) {
      abortControllers[fileName].abort();
      setAbortControllers((prev) => {
        const newControllers = {...prev};
        delete newControllers[fileName];
        return newControllers;
      });
    }
  };

  return (
    <>
      {multiple ? (
        <Dropzone
          multiple={multiple}
          onDrop={onDrop}
          {...rest}
          description={description}
          onChange={onChange}
        />
      ) : !files && (
        <Dropzone
          multiple={multiple}
          onDrop={onDrop}
          {...rest}
          description={description}
          onChange={onChange}
        />
      )}
      {files && (
        <div className="mt-4 space-y-2">
          {multiple ? files.map((file: File, index: number) => (
            // this is for multiple files. When multiple files are selected, each file will be shown with a cancel button along with the dropzone thing.
            <Card key={index} className="relative">
              <Button variant="ghost" className="absolute top-2 right-2" onClick={() => handleCancelUpload(file.name)}>
                <XIcon className="h-5 w-5"/>
              </Button>
              <CardHeader>
                <CardTitle>{file.name}</CardTitle>
                <CardDescription>{(file.size / 1024).toFixed(2)} KB</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={uploadProgress[file.name] || 0}/>
              </CardContent>
            </Card>
          )) : (
            // this is for a single file. When file is selected, only the file preview will be shown with a cancel button.
            <Card className="relative">
              <Button variant="ghost" className="absolute top-2 right-2" onClick={() => handleCancelUpload(files.name)}>
                <XIcon className="h-5 w-5"/>
              </Button>
              <CardHeader>
                <CardTitle>{files.name}</CardTitle>
                <CardDescription>{(files.size / 1024).toFixed(2)} KB</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={uploadProgress[files.name] || 0}/>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

const Dropzone: FC<{
  multiple?: boolean;
  description?: string;
  onDrop: (acceptedFiles: File[]) => void;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}> = ({multiple, description, onChange, onDrop, ...rest}) => {
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    multiple,
    ...rest,
    onDrop
  });

  return (
    <div {...getRootProps()}>
      {isDragActive ? (
        // this is the drag active state, you can style this as you like
        <div
          className="flex flex-col items-center justify-center bg-gray-400 space-y-4 py-12 px-6 border-2 border-gray-300 border-dashed rounded-md transition-colors hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
          <UploadIcon className="h-12 w-12 text-gray-600"/>
          <div className="font-medium text-gray-900 dark:text-gray-50">Please Drop
            the {multiple ? 'files' : 'file'} within the highlighted
            area.
          </div>
          {description && <div className="text-sm text-gray-500">{description}</div>}
        </div>
      ) : (
        // this is the default state, you can style this as you like
        <div
          className="flex flex-col items-center justify-center space-y-4 py-12 px-6 border-2 border-gray-300 border-dashed rounded-md transition-colors hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
          <UploadIcon className="h-12 w-12 text-gray-600"/>
          <div className="font-medium text-gray-900 dark:text-gray-50">Drop {multiple ? 'files' : 'file'} here or click
            to upload
          </div>
          {description && <div className="text-sm text-gray-500">{description}</div>}
          <Input {...getInputProps({onChange})} />
        </div>
      )}
    </div>
  );
};
