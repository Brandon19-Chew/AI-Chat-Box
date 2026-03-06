import { View } from "react-native";
import { FileAttachment } from "./file-attachment";
import { trpc } from "@/lib/trpc";

export interface MessageAttachmentListProps {
  messageId: number;
}

/**
 * Component to display attachments for a message
 */
export function MessageAttachmentList({ messageId }: MessageAttachmentListProps) {
  const { data: attachments = [], isLoading } = trpc.chat.getAttachments.useQuery(
    { messageId },
    { enabled: !!messageId }
  );

  if (isLoading || attachments.length === 0) {
    return null;
  }

  return (
    <View className="mt-2 w-full max-w-xs">
      {attachments.map((attachment) => (
        <FileAttachment
          key={attachment.id}
          fileName={attachment.fileName}
          fileType={attachment.fileType as "image" | "text" | "file"}
          mimeType={attachment.mimeType}
          fileUrl={attachment.fileUrl}
          fileContent={attachment.fileContent || undefined}
        />
      ))}
    </View>
  );
}
