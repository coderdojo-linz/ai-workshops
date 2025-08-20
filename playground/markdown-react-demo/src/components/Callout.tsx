import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as Icons from "lucide-react";
import styles from "./Callout.module.css";

type CalloutType =
  | "note"
  | "abstract"
  | "info"
  | "todo"
  | "important"
  | "tip"
  | "success"
  | "question"
  | "warning"
  | "failure"
  | "danger"
  | "bug"
  | "example"
  | "quote";

const calloutStyles: Record<CalloutType, { color: string; icon: string }> = {
  note: { color: "8, 109, 221", icon: "Pencil" },
  abstract: { color: "0, 191, 188", icon: "ClipboardList" },
  info: { color: "8, 109, 221", icon: "Info" },
  todo: { color: "8, 109, 221", icon: "CheckCircle2" },
  important: { color: "0, 191, 188", icon: "Flame" },
  tip: { color: "0, 191, 188", icon: "Flame" },
  success: { color: "8, 185, 78", icon: "Check" },
  question: { color: "236, 117, 0", icon: "HelpCircle" },
  warning: { color: "236, 117, 0", icon: "AlertTriangle" },
  failure: { color: "233, 49, 71", icon: "X" },
  danger: { color: "233, 49, 71", icon: "Zap" },
  bug: { color: "233, 49, 71", icon: "Bug" },
  example: { color: "120, 82, 238", icon: "List" },
  quote: { color: "158, 158, 158", icon: "Quote" }
};

interface CalloutProps {
  readonly type?: CalloutType;
  readonly title?: string;
  readonly icon?: string;
  readonly content?: React.ReactNode | string;
  readonly foldable?: boolean;
  readonly folded?: boolean;
}

export default function Callout({
  type = "note",
  title,
  icon,
  content,
  foldable = false,
  folded = false,
}: CalloutProps) {
  const [collapsed, setCollapsed] = useState<boolean>(folded);
  const style = calloutStyles[type ?? "note"] || calloutStyles.note;

  // Safe icon lookup: prefer provided icon name, fall back to style.icon
  const iconName = (icon as string) || style.icon;
  const IconComponent = (Icons as any)[iconName] as
    | React.ComponentType<any>
    | undefined;

  return (
    <div
      className={`${styles.callout} ${foldable ? styles.foldable : ""} ${collapsed ? styles.collapsed : ""
        }`}
      style={{ ["--callout-color" as any]: style.color } as React.CSSProperties}
    >
      {foldable ? (
        <button
          type="button"
          className={styles.title}
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          <div className={styles.titleLeft}>
            {IconComponent ? <IconComponent size={18} /> : null}
            <span>{title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
          <div>
            <ChevronDown className={styles.foldArrow} size={18} />
          </div>
        </button>
      ) : (
        <div className={styles.title}>
          <div className={styles.titleLeft}>
            {IconComponent ? <IconComponent size={18} /> : null}
            <span>{title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
          <div></div>
        </div>
      )}
      {content && (
        <div className={styles.content}>
          {content}
        </div>
      )}
    </div>
  );
}
