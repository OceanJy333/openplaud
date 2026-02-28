"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
    lastSyncTime: Date | null;
    nextSyncTime: Date | null;
    isAutoSyncing: boolean;
    lastSyncResult: {
        success: boolean;
        newRecordings?: number;
        error?: string;
    } | null;
    className?: string;
}

export function SyncStatus({
    lastSyncTime,
    nextSyncTime,
    isAutoSyncing,
    lastSyncResult,
    className,
}: SyncStatusProps) {
    const getStatusIcon = () => {
        if (isAutoSyncing) {
            return <RefreshCw className="w-3 h-3 text-primary animate-spin" />;
        }

        if (lastSyncResult?.success) {
            return <CheckCircle2 className="w-3 h-3 text-accent-green" />;
        }

        if (lastSyncResult?.success === false) {
            return <AlertCircle className="w-3 h-3 text-destructive" />;
        }

        return <Clock className="w-3 h-3 text-muted-foreground" />;
    };

    const getStatusText = () => {
        if (isAutoSyncing) {
            return "同步中...";
        }

        if (lastSyncResult?.success === false) {
            return "同步失败";
        }

        if (lastSyncTime) {
            try {
                return `${formatDistanceToNow(lastSyncTime, {
                    addSuffix: true,
                    locale: zhCN,
                })}同步`;
            } catch {
                return "最近已同步";
            }
        }

        return "从未同步";
    };

    const getNextSyncText = () => {
        if (isAutoSyncing || !nextSyncTime) {
            return null;
        }

        try {
            const now = new Date();
            const diff = nextSyncTime.getTime() - now.getTime();

            if (diff < 60000) {
                return "即将同步";
            }

            return `${formatDistanceToNow(nextSyncTime, {
                addSuffix: true,
                locale: zhCN,
            })}同步`;
        } catch {
            return null;
        }
    };

    const nextSyncText = getNextSyncText();

    return (
        <div
            className={cn(
                "flex items-center gap-2 text-xs text-muted-foreground",
                className,
            )}
        >
            {getStatusIcon()}
            <div className="flex flex-col">
                <span className="font-medium">{getStatusText()}</span>
                {nextSyncText && (
                    <span className="text-[10px] opacity-70">
                        {nextSyncText}
                    </span>
                )}
                {lastSyncResult?.success &&
                    lastSyncResult.newRecordings !== undefined &&
                    lastSyncResult.newRecordings > 0 && (
                        <span className="text-[10px] text-primary">
                            {lastSyncResult.newRecordings} 条新录音
                        </span>
                    )}
                {lastSyncResult?.error && (
                    <span className="text-[10px] text-destructive">
                        {lastSyncResult.error}
                    </span>
                )}
            </div>
        </div>
    );
}
