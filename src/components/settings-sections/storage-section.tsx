"use client";

import { HardDrive } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";

export function StorageSection() {
    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [autoDeleteRecordings, setAutoDeleteRecordings] = useState(false);
    const [retentionDays, setRetentionDays] = useState<number | null>(null);
    const [storageUsage, setStorageUsage] = useState<{
        storageType: string;
        totalSizeMB: string;
        totalRecordings: number;
    } | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setAutoDeleteRecordings(data.autoDeleteRecordings ?? false);
                    setRetentionDays(data.retentionDays ?? null);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();

        fetch("/api/settings/storage")
            .then((res) => res.json())
            .then((data) => setStorageUsage(data))
            .catch(() => setStorageUsage(null));
    }, [setIsLoadingSettings]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleStorageSettingChange = async (updates: {
        autoDeleteRecordings?: boolean;
        retentionDays?: number | null;
    }) => {
        const previousValues: Record<string, unknown> = {};
        if (updates.autoDeleteRecordings !== undefined) {
            previousValues.autoDeleteRecordings = autoDeleteRecordings;
            setAutoDeleteRecordings(updates.autoDeleteRecordings);
        }
        if (updates.retentionDays !== undefined) {
            previousValues.retentionDays = retentionDays;
            setRetentionDays(updates.retentionDays);
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
            if (updates.autoDeleteRecordings !== undefined) {
                const prev = previousValues.autoDeleteRecordings;
                if (typeof prev === "boolean") setAutoDeleteRecordings(prev);
            }
            if (updates.retentionDays !== undefined) {
                const prev = previousValues.retentionDays;
                if (typeof prev === "number" || prev === null)
                    setRetentionDays(prev);
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
                <HardDrive className="w-5 h-5" />
                存储
            </h2>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">类型</span>
                    <span className="font-medium">
                        {storageUsage?.storageType || "本地"}
                    </span>
                </div>
                {storageUsage && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                总大小
                            </span>
                            <span className="font-medium">
                                {storageUsage.totalSizeMB} MB
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                录音数
                            </span>
                            <span className="font-medium">
                                {storageUsage.totalRecordings}
                            </span>
                        </div>
                    </>
                )}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                    存储通过实例级别的环境变量配置。
                </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label htmlFor="auto-delete" className="text-base">
                            自动删除旧录音
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            自动删除超过保留期限的录音
                        </p>
                    </div>
                    <Switch
                        id="auto-delete"
                        checked={autoDeleteRecordings}
                        onCheckedChange={(checked) => {
                            setAutoDeleteRecordings(checked);
                            if (!checked) {
                                setRetentionDays(null);
                            }
                            handleStorageSettingChange({
                                autoDeleteRecordings: checked,
                                retentionDays: checked ? retentionDays : null,
                            });
                        }}
                        disabled={isSavingSettings}
                    />
                </div>

                {autoDeleteRecordings && (
                    <div className="space-y-2">
                        <Label htmlFor="retention-days">
                            保留期限（天）
                        </Label>
                        <Input
                            id="retention-days"
                            type="number"
                            min={1}
                            max={365}
                            value={retentionDays || ""}
                            onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (
                                    !Number.isNaN(value) &&
                                    value >= 1 &&
                                    value <= 365
                                ) {
                                    setRetentionDays(value);
                                    if (saveTimeoutRef.current) {
                                        clearTimeout(saveTimeoutRef.current);
                                    }
                                    saveTimeoutRef.current = setTimeout(() => {
                                        handleStorageSettingChange({
                                            retentionDays: value,
                                        });
                                    }, 500);
                                } else if (e.target.value === "") {
                                    setRetentionDays(null);
                                    handleStorageSettingChange({
                                        retentionDays: null,
                                    });
                                }
                            }}
                            placeholder="30"
                        />
                        <p className="text-xs text-muted-foreground">
                            超过此期限的录音将被自动删除（1-365 天）
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
