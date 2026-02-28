"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";

const syncIntervalPresets = [
    { label: "1 分钟", value: 60 * 1000 },
    { label: "2 分钟", value: 2 * 60 * 1000 },
    { label: "5 分钟", value: 5 * 60 * 1000 },
    { label: "10 分钟", value: 10 * 60 * 1000 },
    { label: "15 分钟", value: 15 * 60 * 1000 },
    { label: "30 分钟", value: 30 * 60 * 1000 },
    { label: "1 小时", value: 60 * 60 * 1000 },
];

const getSyncIntervalLabel = (value: number) => {
    return (
        syncIntervalPresets.find((p) => p.value === value)?.label || "自定义"
    );
};

export function SyncSection() {
    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [syncInterval, setSyncInterval] = useState(300000);
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [syncOnMount, setSyncOnMount] = useState(true);
    const [syncOnVisibilityChange, setSyncOnVisibilityChange] = useState(true);
    const [syncNotifications, setSyncNotifications] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setSyncInterval(data.syncInterval ?? 300000);
                    setAutoSyncEnabled(data.autoSyncEnabled ?? true);
                    setSyncOnMount(data.syncOnMount ?? true);
                    setSyncOnVisibilityChange(
                        data.syncOnVisibilityChange ?? true,
                    );
                    setSyncNotifications(data.syncNotifications ?? true);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handleSyncSettingChange = async (updates: {
        syncInterval?: number;
        autoSyncEnabled?: boolean;
        syncOnMount?: boolean;
        syncOnVisibilityChange?: boolean;
        syncNotifications?: boolean;
    }) => {
        const previousValues: Record<string, unknown> = {};
        if (updates.syncInterval !== undefined) {
            previousValues.syncInterval = syncInterval;
            setSyncInterval(updates.syncInterval);
        }
        if (updates.autoSyncEnabled !== undefined) {
            previousValues.autoSyncEnabled = autoSyncEnabled;
            setAutoSyncEnabled(updates.autoSyncEnabled);
        }
        if (updates.syncOnMount !== undefined) {
            previousValues.syncOnMount = syncOnMount;
            setSyncOnMount(updates.syncOnMount);
        }
        if (updates.syncOnVisibilityChange !== undefined) {
            previousValues.syncOnVisibilityChange = syncOnVisibilityChange;
            setSyncOnVisibilityChange(updates.syncOnVisibilityChange);
        }
        if (updates.syncNotifications !== undefined) {
            previousValues.syncNotifications = syncNotifications;
            setSyncNotifications(updates.syncNotifications);
        }

        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }
        } catch {
            if (updates.syncInterval !== undefined) {
                const prev = previousValues.syncInterval;
                if (typeof prev === "number") setSyncInterval(prev);
            }
            if (updates.autoSyncEnabled !== undefined) {
                const prev = previousValues.autoSyncEnabled;
                if (typeof prev === "boolean") setAutoSyncEnabled(prev);
            }
            if (updates.syncOnMount !== undefined) {
                const prev = previousValues.syncOnMount;
                if (typeof prev === "boolean") setSyncOnMount(prev);
            }
            if (updates.syncOnVisibilityChange !== undefined) {
                const prev = previousValues.syncOnVisibilityChange;
                if (typeof prev === "boolean") setSyncOnVisibilityChange(prev);
            }
            if (updates.syncNotifications !== undefined) {
                const prev = previousValues.syncNotifications;
                if (typeof prev === "boolean") setSyncNotifications(prev);
            }
            toast.error("保存设置失败，已恢复更改。");
        }
    };

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                同步设置
            </h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label htmlFor="auto-sync" className="text-base">
                            启用自动同步
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            定时从 Plaud 设备自动同步录音
                        </p>
                    </div>
                    <Switch
                        id="auto-sync"
                        checked={autoSyncEnabled}
                        onCheckedChange={(checked) => {
                            setAutoSyncEnabled(checked);
                            handleSyncSettingChange({
                                autoSyncEnabled: checked,
                            });
                        }}
                        disabled={isSavingSettings}
                    />
                </div>

                {autoSyncEnabled && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="sync-interval">同步间隔</Label>
                            <Select
                                value={syncInterval.toString()}
                                onValueChange={(value) => {
                                    const interval = parseInt(value, 10);
                                    setSyncInterval(interval);
                                    handleSyncSettingChange({
                                        syncInterval: interval,
                                    });
                                }}
                                disabled={isSavingSettings}
                            >
                                <SelectTrigger
                                    id="sync-interval"
                                    className="w-full"
                                >
                                    <SelectValue>
                                        {getSyncIntervalLabel(syncInterval)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {syncIntervalPresets.map((preset) => (
                                        <SelectItem
                                            key={preset.value}
                                            value={preset.value.toString()}
                                        >
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                自动同步录音的频率
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5 flex-1">
                                <Label
                                    htmlFor="sync-on-mount"
                                    className="text-base"
                                >
                                    启动时同步
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    应用加载时自动同步
                                </p>
                            </div>
                            <Switch
                                id="sync-on-mount"
                                checked={syncOnMount}
                                onCheckedChange={(checked) => {
                                    setSyncOnMount(checked);
                                    handleSyncSettingChange({
                                        syncOnMount: checked,
                                    });
                                }}
                                disabled={isSavingSettings}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5 flex-1">
                                <Label
                                    htmlFor="sync-on-visibility"
                                    className="text-base"
                                >
                                    切回标签页时同步
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    返回应用标签页时自动同步
                                </p>
                            </div>
                            <Switch
                                id="sync-on-visibility"
                                checked={syncOnVisibilityChange}
                                onCheckedChange={(checked) => {
                                    setSyncOnVisibilityChange(checked);
                                    handleSyncSettingChange({
                                        syncOnVisibilityChange: checked,
                                    });
                                }}
                                disabled={isSavingSettings}
                            />
                        </div>
                    </>
                )}

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label
                            htmlFor="sync-notifications"
                            className="text-base"
                        >
                            显示同步通知
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            同步完成时显示通知
                        </p>
                    </div>
                    <Switch
                        id="sync-notifications"
                        checked={syncNotifications}
                        onCheckedChange={(checked) => {
                            setSyncNotifications(checked);
                            handleSyncSettingChange({
                                syncNotifications: checked,
                            });
                        }}
                        disabled={isSavingSettings}
                    />
                </div>
            </div>
        </div>
    );
}
