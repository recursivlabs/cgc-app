/**
 * Ambassador video drop-off. Ambassadors send raw clips from their phone;
 * the files land in project storage and the social team downloads them from
 * one list instead of digging through texts and email.
 */

import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { Readable } from "node:stream";
import { getRecursiv } from "@/lib/recursiv";
import { PROJECT_ID } from "@/lib/constants";

export const VIDEO_BUCKET = "ambassador-videos";

export { MAX_VIDEO_BYTES, videoType, videoKey, uploadRateLimited, formatBytes } from "@/lib/video-rules";

/* ---------- Storage ---------- */

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  await getRecursiv().storage.ensureBucket({ project_id: PROJECT_ID, name: VIDEO_BUCKET });
  bucketReady = true;
}

/**
 * Stream the request body straight into storage, never holding the file in
 * memory. Our server does the PUT so the browser never talks to the storage
 * host (the site's security policy only allows itself).
 */
export async function putVideo(
  key: string,
  contentType: string,
  size: number,
  body: ReadableStream<Uint8Array>
): Promise<void> {
  await ensureBucket();
  const { data } = await getRecursiv().storage.getUploadUrl({
    project_id: PROJECT_ID,
    bucket_name: VIDEO_BUCKET,
    key,
    content_type: contentType,
  });

  await new Promise<void>((resolve, reject) => {
    const request = data.url.startsWith("http://") ? httpRequest : httpsRequest;
    const req = request(
      data.url,
      {
        method: "PUT",
        headers: { "Content-Type": contentType, "Content-Length": String(size) },
        timeout: 15 * 60 * 1000,
      },
      (res) => {
        let detail = "";
        res.setEncoding("utf8");
        res.on("data", (c) => {
          if (detail.length < 500) detail += c;
        });
        res.on("end", () => {
          const status = res.statusCode || 0;
          if (status >= 200 && status < 300) resolve();
          else reject(new Error(`storage PUT ${status}: ${detail.slice(0, 300)}`));
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("storage PUT timed out")));
    req.on("error", reject);
    const source = Readable.fromWeb(body as unknown as import("node:stream/web").ReadableStream);
    source.on("error", (err) => req.destroy(err));
    source.pipe(req);
  });
}

export async function videoDownloadUrl(key: string): Promise<string> {
  const { data } = await getRecursiv().storage.getDownloadUrl({
    project_id: PROJECT_ID,
    bucket_name: VIDEO_BUCKET,
    key,
  });
  return data.url;
}
