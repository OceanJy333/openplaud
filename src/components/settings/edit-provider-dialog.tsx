"use client";

import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Provider {
    id: string;
    provider: string;
    baseUrl: string | null;
    defaultModel: string | null;
    isDefaultTranscription: boolean;
    isDefaultEnhancement: boolean;
}

interface EditProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    provider: Provider | null;
    onSuccess: () => void;
}

const providerPresets = [
    {
        name: "OpenAI",
        baseUrl: "",
        placeholder: "sk-...",
        defaultModel: "whisper-1",
    },
    {
        name: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        placeholder: "gsk_...",
        defaultModel: "whisper-large-v3-turbo",
    },
    {
        name: "Together AI",
        baseUrl: "https://api.together.xyz/v1",
        placeholder: "...",
        defaultModel: "whisper-large-v3",
    },
    {
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        placeholder: "sk-or-...",
        defaultModel: "whisper-1",
    },
    {
        name: "LM Studio",
        baseUrl: "http://localhost:1234/v1",
        placeholder: "lm-studio",
        defaultModel: "",
    },
    {
        name: "Ollama",
        baseUrl: "http://localhost:11434/v1",
        placeholder: "ollama",
        defaultModel: "",
    },
    {
        name: "Custom",
        baseUrl: "",
        placeholder: "您的 API Key",
        defaultModel: "",
    },
];

export function EditProviderDialog({
    open,
    onOpenChange,
    provider,
    onSuccess,
}: EditProviderDialogProps) {
    const [providerName, setProviderName] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [defaultModel, setDefaultModel] = useState("");
    const [isDefaultTranscription, setIsDefaultTranscription] = useState(false);
    const [isDefaultEnhancement, setIsDefaultEnhancement] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && provider) {
            setProviderName(provider.provider);
            setBaseUrl(provider.baseUrl || "");
            setDefaultModel(provider.defaultModel || "");
            setIsDefaultTranscription(provider.isDefaultTranscription);
            setIsDefaultEnhancement(provider.isDefaultEnhancement);
            setApiKey("");
        } else if (!open) {
            setProviderName("");
            setApiKey("");
            setBaseUrl("");
            setDefaultModel("");
            setIsDefaultTranscription(false);
            setIsDefaultEnhancement(false);
        }
    }, [open, provider]);

    const handleProviderChange = (value: string) => {
        setProviderName(value);
        const preset = providerPresets.find((p) => p.name === value);
        if (preset) {
            setBaseUrl(preset.baseUrl);
            setDefaultModel(preset.defaultModel);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!providerName) {
            toast.error("请选择服务商");
            return;
        }

        if (!provider?.id) {
            toast.error("缺少服务商 ID");
            return;
        }

        setIsLoading(true);
        try {
            const updateData: {
                baseUrl: string | null;
                defaultModel: string | null;
                isDefaultTranscription: boolean;
                isDefaultEnhancement: boolean;
                apiKey?: string;
            } = {
                baseUrl: baseUrl || null,
                defaultModel: defaultModel || null,
                isDefaultTranscription,
                isDefaultEnhancement,
            };

            if (apiKey.trim()) {
                updateData.apiKey = apiKey;
            }

            const response = await fetch(
                `/api/settings/ai/providers/${provider.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updateData),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "更新服务商失败");
            }

            toast.success("AI 服务商已更新");
            onSuccess();
            onOpenChange(false);

            setProviderName("");
            setApiKey("");
            setBaseUrl("");
            setDefaultModel("");
            setIsDefaultTranscription(false);
            setIsDefaultEnhancement(false);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "更新 AI 服务商失败",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const selectedPreset = providerPresets.find((p) => p.name === providerName);

    if (!open || !provider) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} key={provider.id}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>编辑 AI 服务商</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>服务商</Label>
                        <Select
                            value={providerName}
                            onValueChange={handleProviderChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择服务商" />
                            </SelectTrigger>
                            <SelectContent>
                                {providerPresets.map((preset) => (
                                    <SelectItem
                                        key={preset.name}
                                        value={preset.name}
                                    >
                                        {preset.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder={
                                selectedPreset?.placeholder ||
                                "输入新密钥以替换当前密钥"
                            }
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                为安全起见，已保存的 API Key 不会显示。留空则保留当前密钥，输入新密钥则替换。
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baseUrl">Base URL（可选）</Label>
                        <Input
                            id="baseUrl"
                            type="text"
                            placeholder="https://api.example.com/v1"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultModel">
                            默认模型（可选）
                        </Label>
                        <Input
                            id="defaultModel"
                            type="text"
                            placeholder="whisper-1, gpt-4o, etc."
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <Panel variant="inset" className="space-y-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefaultTranscription}
                                onChange={(e) =>
                                    setIsDefaultTranscription(e.target.checked)
                                }
                                disabled={isLoading}
                            />
                            <span>用于转录</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefaultEnhancement}
                                onChange={(e) =>
                                    setIsDefaultEnhancement(e.target.checked)
                                }
                                disabled={isLoading}
                            />
                            <span>用于 AI 增强</span>
                        </label>
                    </Panel>

                    <div className="flex gap-2">
                        <MetalButton
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            取消
                        </MetalButton>
                        <MetalButton
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? "更新中..." : "更新服务商"}
                        </MetalButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
