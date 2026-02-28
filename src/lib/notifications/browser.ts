/**
 * Browser notification utilities
 */

export async function requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
}

export function showBrowserNotification(
    title: string,
    options?: NotificationOptions,
): void {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...options,
        });
    }
}

export function showNewRecordingNotification(count: number): void {
    const title =
        count === 1 ? "已同步新录音" : `已同步 ${count} 条新录音`;

    showBrowserNotification(title, {
        body:
            count === 1
                ? "已从 Plaud 设备同步一条新录音"
                : `已从 Plaud 设备同步 ${count} 条新录音`,
        tag: "new-recording",
    });
}

export function showSyncCompleteNotification(): void {
    showBrowserNotification("同步完成", {
        body: "录音已成功同步",
        tag: "sync-complete",
    });
}
