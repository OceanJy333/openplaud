"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LEDIndicator } from "@/components/led-indicator";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DEFAULT_SERVER_KEY,
    PLAUD_SERVERS,
    type PlaudServerKey,
} from "@/lib/plaud/servers";

type Step = "plaud" | "complete";

export function OnboardingForm() {
    const [step, setStep] = useState<Step>("plaud");
    const [bearerToken, setBearerToken] = useState("");
    const [server, setServer] = useState<PlaudServerKey>(DEFAULT_SERVER_KEY);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handlePlaudSetup = async () => {
        if (!bearerToken.trim()) {
            toast.error("请输入 Bearer Token");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/plaud/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bearerToken, server }),
            });

            if (!response.ok) throw new Error("连接失败");

            toast.success("Plaud 设备已连接");
            setStep("complete");
        } catch {
            toast.error("连接 Plaud 失败");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Panel className="w-full max-w-2xl space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                    <LEDIndicator active={step === "plaud"} status="active" />
                    <span className="text-sm">Plaud 设置</span>
                </div>
                <div className="flex items-center gap-2">
                    <LEDIndicator
                        active={step === "complete"}
                        status="active"
                    />
                    <span className="text-sm">完成</span>
                </div>
            </div>

            {step === "plaud" && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold">
                            连接 Plaud 设备
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            从 plaud.ai 获取 Bearer Token
                        </p>
                    </div>

                    <Panel variant="inset" className="space-y-3 text-sm">
                        <p className="font-semibold">
                            如何获取 Bearer Token：
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>打开 plaud.ai 并登录</li>
                            <li>按 F12 打开开发者工具 → 网络标签页</li>
                            <li>刷新页面</li>
                            <li>找到任意发往 Plaud API 服务器的请求</li>
                            <li>
                                复制 Authorization 头的值（以 &quot;Bearer &quot; 开头）
                            </li>
                        </ol>
                    </Panel>

                    <div className="space-y-2">
                        <Label htmlFor="apiBase">API 服务器</Label>
                        <Select
                            value={server}
                            onValueChange={(v) =>
                                setServer(v as PlaudServerKey)
                            }
                        >
                            <SelectTrigger id="apiBase" disabled={isLoading}>
                                <SelectValue placeholder="选择 API 服务器" />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                {(
                                    Object.entries(PLAUD_SERVERS) as [
                                        PlaudServerKey,
                                        (typeof PLAUD_SERVERS)[PlaudServerKey],
                                    ][]
                                ).map(([key, s]) => (
                                    <SelectItem key={key} value={key}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {PLAUD_SERVERS[server].description}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bearerToken">Bearer Token（授权令牌）</Label>
                        <Input
                            id="bearerToken"
                            type="text"
                            placeholder="Bearer ..."
                            value={bearerToken}
                            onChange={(e) => setBearerToken(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <MetalButton
                        onClick={handlePlaudSetup}
                        variant="cyan"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? "连接中..." : "连接设备"}
                    </MetalButton>
                </div>
            )}

            {step === "complete" && (
                <div className="space-y-4 text-center">
                    <LEDIndicator
                        active
                        status="active"
                        size="lg"
                        pulse
                        className="mx-auto"
                    />
                    <div>
                        <h2 className="text-2xl font-bold">设置完成！</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            您的录音将自动开始同步
                        </p>
                    </div>
                    <MetalButton
                        onClick={() => router.push("/dashboard")}
                        variant="cyan"
                        className="w-full"
                    >
                        进入工作台
                    </MetalButton>
                </div>
            )}
        </Panel>
    );
}
