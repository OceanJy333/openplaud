"use client";

import {
    ArrowLeft,
    ArrowRight,
    Bot,
    CheckCircle2,
    Mic,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/onboarding-dialog-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type OnboardingStep = "welcome" | "plaud" | "ai-provider" | "complete";

interface OnboardingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function OnboardingDialog({
    open,
    onOpenChange,
    onComplete,
}: OnboardingDialogProps) {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>("welcome");
    const [bearerToken, setBearerToken] = useState("");
    const [server, setServer] = useState<PlaudServerKey>(DEFAULT_SERVER_KEY);
    const [isLoading, setIsLoading] = useState(false);
    const [hasPlaudConnection, setHasPlaudConnection] = useState(false);
    const [hasAiProvider, setHasAiProvider] = useState(false);

    useEffect(() => {
        if (open && step === "plaud") {
            fetch("/api/plaud/connection")
                .then((res) => res.json())
                .then((data) => {
                    if (data.connected) {
                        setHasPlaudConnection(true);
                        if (data.server) {
                            setServer(data.server as PlaudServerKey);
                        }
                    }
                })
                .catch(() => {});
        }
    }, [open, step]);

    useEffect(() => {
        if (open && step === "ai-provider") {
            fetch("/api/settings/ai/providers")
                .then((res) => res.json())
                .then((data) => {
                    if (data.providers && data.providers.length > 0) {
                        setHasAiProvider(true);
                    }
                })
                .catch(() => {});
        }
    }, [open, step]);

    useEffect(() => {
        if (!open) {
            setStep("welcome");
            setBearerToken("");
            setServer(DEFAULT_SERVER_KEY);
            setIsLoading(false);
            setHasPlaudConnection(false);
            setHasAiProvider(false);
        }
    }, [open]);

    const handlePlaudConnect = async () => {
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

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "连接失败");
            }

            toast.success("Plaud 设备已连接");
            setHasPlaudConnection(true);
            setBearerToken("");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "连接 Plaud 失败",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipPlaud = () => {
        setStep("ai-provider");
    };

    const handleSkipAiProvider = () => {
        setStep("complete");
    };

    const handleComplete = async () => {
        try {
            await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingCompleted: true }),
            });
            onComplete();
            onOpenChange(false);
            router.refresh();
        } catch {
            toast.error("完成引导设置失败");
        }
    };

    const getStepIndex = () => {
        const steps: OnboardingStep[] = [
            "welcome",
            "plaud",
            "ai-provider",
            "complete",
        ];
        return steps.indexOf(step);
    };

    const isStepCompleted = (stepIndex: number) => {
        const currentIndex = getStepIndex();
        return stepIndex < currentIndex;
    };

    const isStepCurrent = (stepIndex: number) => {
        const currentIndex = getStepIndex();
        return stepIndex === currentIndex;
    };

    const canSkipStep = () => {
        if (step === "plaud") return true;
        if (step === "ai-provider") return true;
        return false;
    };

    const getNextStep = (): OnboardingStep | null => {
        if (step === "welcome") return "plaud";
        if (step === "plaud") return "ai-provider";
        if (step === "ai-provider") return "complete";
        return null;
    };

    const getPrevStep = (): OnboardingStep | null => {
        if (step === "plaud") return "welcome";
        if (step === "ai-provider") return "plaud";
        if (step === "complete") return "ai-provider";
        return null;
    };

    const handleNext = () => {
        const next = getNextStep();
        if (next) setStep(next);
    };

    const handlePrev = () => {
        const prev = getPrevStep();
        if (prev) setStep(prev);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl" hidden>
                        欢迎使用 OpenPlaud
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {step === "welcome" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mic className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    AI 驱动的录音管理中心
                                </h3>
                                <p className="text-muted-foreground">
                                    OpenPlaud 帮助您管理、转录和增强 Plaud 录音。让我们开始设置您的账户。
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <Card className="gap-0 py-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Mic className="w-4 h-4" />
                                            连接设备
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            连接 Plaud 设备，自动同步录音
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="gap-0 py-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Bot className="w-4 h-4" />
                                            配置 AI 服务商
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            配置 AI 服务商以启用自动转录
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="gap-0 py-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            开始录音
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            一切就绪！开始录音，让 AI 为您工作
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {step === "plaud" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mic className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    连接 Plaud 设备
                                </h3>
                                <p className="text-muted-foreground">
                                    输入 Plaud Bearer Token 以自动同步录音
                                </p>
                            </div>

                            {hasPlaudConnection ? (
                                <Card className="border-primary/50 bg-primary/5 py-3">
                                    <CardContent className="px-4">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    设备已连接
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    您的 Plaud 设备已连接
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setHasPlaudConnection(false)
                                                }
                                            >
                                                重新连接
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="gap-0 py-4">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="api-server">
                                                API 服务器
                                            </Label>
                                            <Select
                                                value={server}
                                                onValueChange={(v) =>
                                                    setServer(
                                                        v as PlaudServerKey,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="api-server"
                                                    disabled={isLoading}
                                                >
                                                    <SelectValue placeholder="选择 API 服务器" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[200]">
                                                    {(
                                                        Object.entries(
                                                            PLAUD_SERVERS,
                                                        ) as [
                                                            PlaudServerKey,
                                                            (typeof PLAUD_SERVERS)[PlaudServerKey],
                                                        ][]
                                                    ).map(([key, s]) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={key}
                                                        >
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    PLAUD_SERVERS[server]
                                                        .description
                                                }
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bearer-token">
                                                Bearer Token（授权令牌）
                                            </Label>
                                            <Input
                                                id="bearer-token"
                                                type="password"
                                                placeholder="输入您的 Plaud Bearer Token"
                                                value={bearerToken}
                                                onChange={(e) =>
                                                    setBearerToken(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={isLoading}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                在浏览器中打开 plaud.ai 并登录，按 F12 打开开发者工具 → 网络标签页，刷新页面后从任意 Plaud API 请求中复制 Authorization 头的值。
                                            </p>
                                        </div>

                                        <Button
                                            onClick={handlePlaudConnect}
                                            disabled={
                                                isLoading || !bearerToken.trim()
                                            }
                                            className="w-full"
                                        >
                                            {isLoading
                                                ? "连接中..."
                                                : "连接设备"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === "ai-provider" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    配置 AI 服务商
                                </h3>
                                <p className="text-muted-foreground">
                                    配置 AI 服务商以启用自动转录
                                </p>
                            </div>

                            {hasAiProvider ? (
                                <Card className="border-primary/50 bg-primary/5 py-3">
                                    <CardContent>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    AI 服务商已配置
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    您已配置 AI 服务商
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="gap-0 py-4">
                                    <CardContent className="pt-6 space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            您可以稍后在设置中配置 AI 服务商。配置后可启用录音自动转录。
                                        </p>
                                        <Button
                                            onClick={() => {
                                                onOpenChange(false);
                                                window.location.href =
                                                    "/dashboard?settings=providers";
                                            }}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            前往设置
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === "complete" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    设置完成！
                                </h3>
                                <p className="text-muted-foreground">
                                    开始录音，剩下的交给 OpenPlaud
                                </p>
                            </div>

                            <Card className="gap-0 py-4">
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    录音自动同步
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Plaud 设备将在后台自动同步录音
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    AI 智能转录
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    配置 AI 服务商以自动转录录音
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    个性化设置
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    随时通过设置菜单调整配置
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-3 relative">
                        <div className="flex gap-2 flex-1">
                            {getPrevStep() && (
                                <Button variant="outline" onClick={handlePrev}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    上一步
                                </Button>
                            )}
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 mt-0.5">
                            {[1, 2, 3, 4].map((stepNum, index) => {
                                const completed = isStepCompleted(index);
                                const current = isStepCurrent(index);
                                return (
                                    <div
                                        key={stepNum}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                            completed || current
                                                ? "bg-primary text-primary-foreground"
                                                : "border-2 border-muted-foreground/30 text-muted-foreground"
                                        }`}
                                    >
                                        {stepNum}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-2 flex-1 justify-end">
                            {canSkipStep() && step !== "complete" && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (step === "plaud") handleSkipPlaud();
                                        if (step === "ai-provider")
                                            handleSkipAiProvider();
                                    }}
                                >
                                    跳过
                                </Button>
                            )}
                            {step === "complete" ? (
                                <Button onClick={handleComplete}>
                                    开始使用
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                getNextStep() && (
                                    <Button onClick={handleNext}>
                                        下一步
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
