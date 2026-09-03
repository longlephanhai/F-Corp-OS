import { useEffect, useRef } from "react";

import { socket } from "../config/socket";

export interface PmProjectChangedEvent {
  type: "PM_PROJECT_CHANGED";

  projectId: string;

  sprintId: string | null;

  entity:
    | "PROJECT"
    | "PROJECT_MANAGER"
    | "SPRINT"
    | "TASK"
    | "TASK_DEPENDENCY"
    | "ALLOCATION"
    | "EVIDENCE";

  action: string;

  entityId: string | null;

  occurredAt: string;
}

interface Options {
  projectId: string | null | undefined;

  sprintId?: string | null;

  onChange: (event: PmProjectChangedEvent) => void | Promise<void>;

  debounceMs?: number;
}

export const usePmProjectRealtime = ({
  projectId,
  sprintId,
  onChange,
  debounceMs = 250,
}: Options) => {
  const onChangeRef = useRef(onChange);

  const timerRef = useRef<number | null>(null);

  // ========================================
  // KEEP LATEST CALLBACK
  // ========================================

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ========================================
  // SOCKET LISTENER
  // ========================================

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const handleChange = (event: PmProjectChangedEvent) => {
      if (!event || event.projectId !== projectId) {
        return;
      }

      // Nếu page đang ở một Sprint cụ thể:
      //
      // - event Sprint khác => bỏ qua
      // - event project-level (sprintId null)
      //   vẫn refresh.
      if (sprintId && event.sprintId && event.sprintId !== sprintId) {
        return;
      }

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        void onChangeRef.current(event);
      }, debounceMs);
    };

    socket.on("pm_project_changed", handleChange);

    return () => {
      socket.off("pm_project_changed", handleChange);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);

        timerRef.current = null;
      }
    };
  }, [projectId, sprintId, debounceMs]);
};
