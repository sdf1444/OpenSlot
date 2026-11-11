type MessageBannerProps = {
  kind: "error" | "success";
  message: string;
  onDismiss: () => void;
};

export function MessageBanner({ kind, message, onDismiss }: MessageBannerProps) {
  return (
    <div className={`message ${kind}`} role={kind === "error" ? "alert" : "status"}>
      {message}
      <button onClick={onDismiss}>×</button>
    </div>
  );
}
