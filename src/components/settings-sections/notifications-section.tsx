"use client";

import { Bell, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";
import { requestNotificationPermission } from "@/lib/notifications/browser";

export function NotificationsSection() {
    const {
        isLoadingSettings,
        isSavingSettings,
        setIsLoadingSettings,
        debouncedSave,
    } = useSettings();

    const [browserNotifications, setBrowserNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [barkNotifications, setBarkNotifications] = useState(false);
    const [notificationSound, setNotificationSound] = useState(true);
    const [notificationEmail, setNotificationEmail] = useState<string>("");
    const [barkPushUrl, setBarkPushUrl] = useState<string>("");
    const [, setBarkPushUrlSet] = useState(false);
    const [userEmail, setUserEmail] = useState<string>("");
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
    const [testEmailStatus, setTestEmailStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setBrowserNotifications(data.browserNotifications ?? true);
                    setEmailNotifications(data.emailNotifications ?? false);
                    setBarkNotifications(data.barkNotifications ?? false);
                    setNotificationSound(data.notificationSound ?? true);
                    setUserEmail(data.userEmail ?? "");
                    setNotificationEmail(
                        data.notificationEmail || data.userEmail || "",
                    );
                    setBarkPushUrl(data.barkPushUrl || "");
                    setBarkPushUrlSet(data.barkPushUrlSet ?? false);
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handleChange = (updates: Record<string, unknown>) => {
        debouncedSave(updates);
    };

    const handleBrowserNotificationsChange = (checked: boolean) => {
        setBrowserNotifications(checked);
        handleChange({ browserNotifications: checked });

        if (checked) {
            // Best-effort permission request; ignore result here
            void requestNotificationPermission();
        }
    };

    const handleEmailNotificationsChange = (checked: boolean) => {
        setEmailNotifications(checked);
        if (checked && !notificationEmail && userEmail) {
            setNotificationEmail(userEmail);
            handleChange({
                emailNotifications: checked,
                notificationEmail: userEmail,
            });
        } else {
            handleChange({ emailNotifications: checked });
        }
    };

    const handleNotificationEmailChange = (email: string) => {
        setNotificationEmail(email);
        debouncedSave({ notificationEmail: email || undefined });
    };

    const handleBarkNotificationsChange = (checked: boolean) => {
        setBarkNotifications(checked);
        handleChange({ barkNotifications: checked });
    };

    const handleBarkPushUrlChange = (url: string) => {
        setBarkPushUrl(url);
        if (url) {
            setBarkPushUrlSet(true);
        } else {
            // If user clears the input, mark as unset
            setBarkPushUrlSet(false);
        }
        debouncedSave({ barkPushUrl: url || null });
    };

    const handleSendTestEmail = async () => {
        const emailToTest = notificationEmail || userEmail;
        if (!emailToTest) {
            setTestEmailStatus({
                type: "error",
                message: "请先输入邮箱地址",
            });
            return;
        }

        setIsSendingTestEmail(true);
        setTestEmailStatus({ type: null, message: "" });

        try {
            const response = await fetch("/api/settings/test-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: emailToTest }),
            });

            const data = await response.json();

            if (response.ok) {
                setTestEmailStatus({
                    type: "success",
                    message: `测试邮件已成功发送至 ${emailToTest}`,
                });
            } else {
                setTestEmailStatus({
                    type: "error",
                    message: data.error || "发送测试邮件失败",
                });
            }
        } catch (err) {
            console.error("Error sending test email:", err);
            setTestEmailStatus({
                type: "error",
                message: "发送测试邮件失败，请重试。",
            });
        } finally {
            setIsSendingTestEmail(false);
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
                <Bell className="w-5 h-5" />
                通知设置
            </h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label
                            htmlFor="browser-notifications"
                            className="text-base"
                        >
                            浏览器通知
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            新录音和同步事件时显示浏览器通知
                        </p>
                    </div>
                    <Switch
                        id="browser-notifications"
                        checked={browserNotifications}
                        onCheckedChange={handleBrowserNotificationsChange}
                        disabled={isSavingSettings}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label
                            htmlFor="email-notifications"
                            className="text-base"
                        >
                            邮件通知
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            新录音时发送邮件通知
                        </p>
                    </div>
                    <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={handleEmailNotificationsChange}
                        disabled={isSavingSettings}
                    />
                </div>

                {emailNotifications && (
                    <div className="space-y-2">
                        <Label htmlFor="notification-email">
                            邮箱地址
                        </Label>
                        <Input
                            id="notification-email"
                            type="email"
                            value={notificationEmail}
                            onChange={(e) =>
                                handleNotificationEmailChange(e.target.value)
                            }
                            placeholder={userEmail || "你的邮箱@example.com"}
                        />
                        <p className="text-xs text-muted-foreground">
                            {userEmail && notificationEmail === userEmail
                                ? "使用账户邮箱，如需更改可输入其他地址。"
                                : "接收通知的邮箱地址"}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSendTestEmail}
                                disabled={
                                    isSendingTestEmail ||
                                    !(notificationEmail || userEmail)
                                }
                            >
                                <Mail className="w-4 h-4" />
                                {isSendingTestEmail
                                    ? "发送中..."
                                    : "发送测试邮件"}
                            </Button>
                            {testEmailStatus.type && (
                                <p
                                    className={`text-xs ${
                                        testEmailStatus.type === "success"
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                >
                                    {testEmailStatus.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label
                            htmlFor="bark-notifications"
                            className="text-base"
                        >
                            Bark 推送通知
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            新录音时通过 Bark 发送推送通知
                        </p>
                    </div>
                    <Switch
                        id="bark-notifications"
                        checked={barkNotifications}
                        onCheckedChange={handleBarkNotificationsChange}
                        disabled={isSavingSettings}
                    />
                </div>

                {barkNotifications && (
                    <div className="space-y-2">
                        <Label htmlFor="bark-push-url">Bark 推送 URL</Label>
                        <Input
                            id="bark-push-url"
                            type="url"
                            value={barkPushUrl}
                            onChange={(e) =>
                                handleBarkPushUrlChange(e.target.value)
                            }
                            placeholder="https://api.day.app/your_key"
                        />
                        <p className="text-xs text-muted-foreground">
                            从 Bark 应用中复制完整的推送 URL（如：https://api.day.app/your_key）
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                        <Label
                            htmlFor="notification-sound"
                            className="text-base"
                        >
                            通知提示音
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            收到通知时播放提示音
                        </p>
                    </div>
                    <Switch
                        id="notification-sound"
                        checked={notificationSound}
                        onCheckedChange={(checked) => {
                            setNotificationSound(checked);
                            handleChange({ notificationSound: checked });
                        }}
                        disabled={isSavingSettings}
                    />
                </div>
            </div>
        </div>
    );
}
