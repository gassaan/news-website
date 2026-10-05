import { useRef, useState } from "react";
import {
  type ArrayOfObjectsInputProps,
  insert,
  setIfMissing,
  useClient,
} from "sanity";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";

function UploadIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M12.5 15.5v-10M8 10l4.5-4.5L17 10M6.5 19.5h12" />
    </svg>
  );
}

// Uploads at the same time; more makes a phone connection crawl.
const AT_ONCE = 3;

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

// The gallery's photo list with a "choose many photos" button on top: pick
// several pictures at once (also on iPhone), they upload and join the list.
export default function MultiPhotoUpload(props: ArrayOfObjectsInputProps) {
  const { onChange, readOnly, renderDefault } = props;
  const client = useClient({ apiVersion: "2025-02-19" });
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [failed, setFailed] = useState(0);

  async function uploadAll(files: File[]) {
    if (!files.length) return;
    setFailed(0);
    setProgress({ done: 0, total: files.length });
    onChange(setIfMissing([]));
    let next = 0;
    let done = 0;
    let errors = 0;

    async function worker() {
      while (next < files.length) {
        const file = files[next++];
        try {
          const asset = await client.assets.upload("image", file, {
            filename: file.name,
          });
          // Each photo joins the list as soon as it is up, so nothing is lost if one fails.
          onChange(
            insert(
              [
                {
                  _type: "image",
                  _key: newKey(),
                  asset: { _type: "reference", _ref: asset._id },
                },
              ],
              "after",
              [-1],
            ),
          );
        } catch {
          errors += 1;
          setFailed(errors);
        }
        done += 1;
        setProgress({ done, total: files.length });
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(AT_ONCE, files.length) }, worker),
    );
    setProgress(null);
  }

  const busy = progress !== null;

  return (
    <Stack gap={3}>
      {!readOnly && (
        <Card padding={3} radius={3} border tone="primary">
          <Stack gap={3}>
            <Flex align="center" gap={3} wrap="wrap">
              <Button
                icon={UploadIcon}
                text={
                  busy
                    ? `އަޕްލޯޑް ކުރަނީ… ${progress.done} / ${progress.total}`
                    : "ގިނަ ފޮޓޯ އެއްފަހަރާ އިޚްތިޔާރު ކުރައްވާ"
                }
                tone="primary"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              />
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  void uploadAll(files);
                }}
              />
            </Flex>
            <Text size={1} muted>
              ފޮޓޯ ލައިބްރަރީން ގިނަ ފޮޓޯ ހޮވާލައްވާ. ހުރިހާ ފޮޓޯއެއް ތިރީގައިވާ
              ލިސްޓަށް އިތުރުވާނެ.
            </Text>
            {failed > 0 && (
              <Text
                size={1}
                style={{ color: "var(--card-badge-critical-fg-color, #c00)" }}
              >
                {failed} ފޮޓޯ އަޕްލޯޑް ނުކުރެވުނު. އަނެއްކާ މަސައްކަތް
                ކޮށްލައްވާ.
              </Text>
            )}
          </Stack>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  );
}
