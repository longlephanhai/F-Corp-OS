import { useEffect, useRef } from "react";

import { connectSocket, socket } from "../config/socket";

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
    // Sprint page có thể listen chỉ bằng
    // sprintId, không bắt buộc phải đợi
    // sprintInfo/projectId load xong.
    if (!projectId && !sprintId) {
      return;
    }

    // Hook realtime phải tự đảm bảo
    // main socket đã được connect.
    connectSocket();

    console.log("[PM Realtime] Listener mounted:", {
      projectId,
      sprintId,
      socketConnected: socket.connected,
      socketId: socket.id,
    });

    const handleChange = (event: PmProjectChangedEvent) => {
      console.log("[PM Realtime] Event received:", event);

      if (!event) {
        return;
      }

      // ====================================
      // SPRINT-SPECIFIC PAGE
      //
      // Nếu đang đứng trong Sprint cụ thể,
      // sprintId là filter đáng tin nhất.
      // ====================================

      if (sprintId) {
        if (event.sprintId && event.sprintId !== sprintId) {
          return;
        }

        // Project-level event không có
        // sprintId thì dùng projectId
        // để kiểm tra nếu đã biết project.
        if (!event.sprintId && projectId && event.projectId !== projectId) {
          return;
        }
      } else if (projectId && event.projectId !== projectId) {
        // ==================================
        // PROJECT-SPECIFIC PAGE
        // ==================================

        return;
      }

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(
        () => {
          console.log("[PM Realtime] Apply refresh:", {
            entity: event.entity,

            action: event.action,

            entityId: event.entityId,

            sprintId: event.sprintId,
          });

          void onChangeRef.current(event);
        },

        debounceMs,
      );
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
