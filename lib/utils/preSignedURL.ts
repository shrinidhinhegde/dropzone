'use server'
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const getPreSignedURL = async (key: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: key,
    ContentType: 'text/plain',
  });

  return await getSignedUrl(s3Client, command, {expiresIn: 60})
};