"use client";

import { Bot, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddProviderDialog } from "@/components/settings/add-provider-dialog";
import { EditProviderDialog } from "@/components/settings/edit-provider-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { useSettings } from "@/hooks/use-settings";
import { PROMPT_PRESETS } from "@/lib/ai/prompt-presets";

type AISubSection = "providers" | "prompts";

interface Provider {
    id: string;
    provider: string;
    baseUrl: string | null;
    defaultModel: string | null;
    isDefaultTranscription: boolean;
    isDefaultEnhancement: boolean;
    createdAt: Date;
}

interface ProvidersSectionProps {
    initialProviders?: Provider[];
}

export function ProvidersSection({
    initialProviders = [],
}: ProvidersSectionProps) {
    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [providers, setProviders] = useState<Provider[]>(initialProviders);
    const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
    const [isEditProviderOpen, setIsEditProviderOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(
        null,
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [aiSubSection, setAiSubSection] = useState<AISubSection>("providers");
    const [selectedPromptId, setSelectedPromptId] = useState<string>("default");
    const [customPrompts, setCustomPrompts] = useState<
        Array<{
            id: string;
            name: string;
            prompt: string;
            createdAt: string;
        }>
    >([]);
    const [editingCustomPrompt, setEditingCustomPrompt] = useState<{
        id?: string;
        name: string;
        prompt: string;
    } | null>(null);
    const [viewingPromptId, setViewingPromptId] = useState<string | null>(null);

    useEffect(() => {
        setProviders(initialProviders);
    }, [initialProviders]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    if (data.titleGenerationPrompt) {
                        const promptConfig = data.titleGenerationPrompt as {
                            selectedPrompt?: string;
                            customPrompts?: Array<{
                                id: string;
                                name: string;
                                prompt: string;
                                createdAt: string;
                            }>;
                        };
                        setSelectedPromptId(
                            promptConfig.selectedPrompt || "default",
                        );
                        setCustomPrompts(promptConfig.customPrompts || []);
                    } else {
                        setSelectedPromptId("default");
                        setCustomPrompts([]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handlePromptSettingChange = async (config: {
        selectedPrompt: string;
        customPrompts: Array<{
            id: string;
            name: string;
            prompt: string;
            createdAt: string;
        }>;
    }) => {
        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titleGenerationPrompt: config,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save prompt settings");
            }
            toast.success("提示词设置已保存");
        } catch {
            toast.error("保存提示词设置失败");
        }
    };

    const handleSaveCustomPrompt = async (prompt: {
        id?: string;
        name: string;
        prompt: string;
    }) => {
        const isEdit = !!prompt.id;
        const newPrompt = {
            id: prompt.id || nanoid(),
            name: prompt.name,
            prompt: prompt.prompt,
            createdAt: isEdit
                ? customPrompts.find((p) => p.id === prompt.id)?.createdAt ||
                  new Date().toISOString()
                : new Date().toISOString(),
        };

        const updatedPrompts = isEdit
            ? customPrompts.map((p) => (p.id === prompt.id ? newPrompt : p))
            : [...customPrompts, newPrompt];

        setCustomPrompts(updatedPrompts);
        setEditingCustomPrompt(null);

        await handlePromptSettingChange({
            selectedPrompt: selectedPromptId,
            customPrompts: updatedPrompts,
        });
    };

    const handleDeleteCustomPrompt = async (id: string) => {
        if (!confirm("确定要删除此自定义提示词吗？")) {
            return;
        }

        const updatedPrompts = customPrompts.filter((p) => p.id !== id);
        setCustomPrompts(updatedPrompts);

        const newSelectedPrompt =
            selectedPromptId === id ? "default" : selectedPromptId;

        setSelectedPromptId(newSelectedPrompt);

        await handlePromptSettingChange({
            selectedPrompt: newSelectedPrompt,
            customPrompts: updatedPrompts,
        });
    };

    const refreshProviders = async () => {
        try {
            const response = await fetch("/api/settings/ai/providers");
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setProviders(data.providers);
        } catch {
            toast.error("刷新服务商列表失败");
        }
    };

    const handleEdit = (provider: Provider) => {
        setEditingProvider(provider);
        setIsEditProviderOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除此服务商吗？")) {
            return;
        }

        setDeletingId(id);
        try {
            const response = await fetch(`/api/settings/ai/providers/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete");
            }

            toast.success("服务商已删除");
            await refreshProviders();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "删除服务商失败",
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        AI 设置
                    </h2>
                    {aiSubSection === "providers" && (
                        <Button
                            onClick={() => setIsAddProviderOpen(true)}
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            添加服务商
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    <button
                        type="button"
                        onClick={() => setAiSubSection("providers")}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            aiSubSection === "providers"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        服务商
                    </button>
                    <button
                        type="button"
                        onClick={() => setAiSubSection("prompts")}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            aiSubSection === "prompts"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        提示词
                    </button>
                </div>

                {/* Providers Section */}
                {aiSubSection === "providers" && (
                    <div>
                        {providers.length === 0 ? (
                            <div className="text-center py-12">
                                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="font-semibold mb-2">
                                    尚未配置服务商
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    添加 AI 服务商以启用转录功能
                                </p>
                                <Button
                                    onClick={() => setIsAddProviderOpen(true)}
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    添加服务商
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {providers.map((provider) => (
                                    <div
                                        key={provider.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">
                                                    {provider.provider}
                                                </h3>
                                                {provider.isDefaultTranscription && (
                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                        转录
                                                    </span>
                                                )}
                                                {provider.isDefaultEnhancement && (
                                                    <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded border border-purple-500/20">
                                                        增强
                                                    </span>
                                                )}
                                            </div>
                                            {provider.defaultModel && (
                                                <p className="text-sm text-muted-foreground">
                                                    模型：{" "}
                                                    {provider.defaultModel}
                                                </p>
                                            )}
                                            {provider.baseUrl && (
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {provider.baseUrl}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                onClick={() =>
                                                    handleEdit(provider)
                                                }
                                                variant="outline"
                                                size="icon"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    handleDelete(provider.id)
                                                }
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    deletingId === provider.id
                                                }
                                            >
                                                {deletingId === provider.id ? (
                                                    <div className="animate-spin w-4 h-4 border-2 border-destructive border-t-transparent rounded-full" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Prompts Section */}
                {aiSubSection === "prompts" && (
                    <div className="space-y-6">
                        {isLoadingSettings ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <>
                                {/* Selected Prompt */}
                                <div className="space-y-2">
                                    <Label htmlFor="selected-prompt">
                                        当前提示词
                                    </Label>
                                    <Select
                                        value={selectedPromptId}
                                        onValueChange={(value) => {
                                            setSelectedPromptId(value);
                                            handlePromptSettingChange({
                                                selectedPrompt: value,
                                                customPrompts,
                                            });
                                        }}
                                        disabled={isSavingSettings}
                                    >
                                        <SelectTrigger id="selected-prompt">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PROMPT_PRESETS).map(
                                                (preset) => (
                                                    <SelectItem
                                                        key={preset.id}
                                                        value={preset.id}
                                                    >
                                                        {preset.name}（预设）
                                                    </SelectItem>
                                                ),
                                            )}
                                            {customPrompts.map((prompt) => (
                                                <SelectItem
                                                    key={prompt.id}
                                                    value={prompt.id}
                                                >
                                                    {prompt.name}（自定义）
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        选择用于标题生成的提示词
                                    </p>
                                </div>

                                {/* Preset Prompts (Read-only) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            预设提示词
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.values(PROMPT_PRESETS).map(
                                            (preset) => (
                                                <div
                                                    key={preset.id}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium">
                                                                    {
                                                                        preset.name
                                                                    }
                                                                </h4>
                                                                {selectedPromptId ===
                                                                    preset.id && (
                                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                                        使用中
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                {
                                                                    preset.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setViewingPromptId(
                                                                    preset.id,
                                                                )
                                                            }
                                                        >
                                                            查看提示词
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Custom Prompts */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            自定义提示词
                                        </h3>
                                        <Button
                                            onClick={() =>
                                                setEditingCustomPrompt({
                                                    name: "",
                                                    prompt: "",
                                                })
                                            }
                                            size="sm"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            添加自定义提示词
                                        </Button>
                                    </div>
                                    {customPrompts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            暂无自定义提示词，创建一个开始使用。
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {customPrompts.map((prompt) => (
                                                <div
                                                    key={prompt.id}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium">
                                                                    {
                                                                        prompt.name
                                                                    }
                                                                </h4>
                                                                {selectedPromptId ===
                                                                    prompt.id && (
                                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                                        使用中
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setViewingPromptId(
                                                                        prompt.id,
                                                                    )
                                                                }
                                                            >
                                                                查看
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingCustomPrompt(
                                                                        {
                                                                            id: prompt.id,
                                                                            name: prompt.name,
                                                                            prompt: prompt.prompt,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDeleteCustomPrompt(
                                                                        prompt.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* View Prompt Dialog */}
                {viewingPromptId && (
                    <Dialog
                        open={!!viewingPromptId}
                        onOpenChange={(open) =>
                            !open && setViewingPromptId(null)
                        }
                    >
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogTitle>
                                {PROMPT_PRESETS[
                                    viewingPromptId as keyof typeof PROMPT_PRESETS
                                ]?.name ||
                                    customPrompts.find(
                                        (p) => p.id === viewingPromptId,
                                    )?.name ||
                                    "提示词"}
                            </DialogTitle>
                            <DialogDescription>
                                {PROMPT_PRESETS[
                                    viewingPromptId as keyof typeof PROMPT_PRESETS
                                ]?.description || "自定义提示词"}
                            </DialogDescription>
                            <div className="mt-4">
                                <pre className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                                    {PROMPT_PRESETS[
                                        viewingPromptId as keyof typeof PROMPT_PRESETS
                                    ]?.prompt ||
                                        customPrompts.find(
                                            (p) => p.id === viewingPromptId,
                                        )?.prompt ||
                                        ""}
                                </pre>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Edit/Create Custom Prompt Dialog */}
                {editingCustomPrompt && (
                    <Dialog
                        open={!!editingCustomPrompt}
                        onOpenChange={(open) =>
                            !open && setEditingCustomPrompt(null)
                        }
                    >
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogTitle>
                                {editingCustomPrompt.id
                                    ? "编辑自定义提示词"
                                    : "创建自定义提示词"}
                            </DialogTitle>
                            <DialogDescription>
                                创建用于标题生成的自定义提示词。使用{" "}
                                <code className="px-1 py-0.5 bg-muted rounded">
                                    {"{transcription}"}
                                </code>{" "}
                                作为转录文本的占位符。
                            </DialogDescription>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="custom-prompt-name">
                                        名称
                                    </Label>
                                    <Input
                                        id="custom-prompt-name"
                                        value={editingCustomPrompt.name}
                                        onChange={(e) =>
                                            setEditingCustomPrompt({
                                                ...editingCustomPrompt,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="我的自定义提示词"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-prompt-text">
                                        提示词
                                    </Label>
                                    <textarea
                                        id="custom-prompt-text"
                                        className="w-full min-h-[300px] px-3 py-2 text-sm border rounded-md resize-y font-mono"
                                        value={editingCustomPrompt.prompt}
                                        onChange={(e) =>
                                            setEditingCustomPrompt({
                                                ...editingCustomPrompt,
                                                prompt: e.target.value,
                                            })
                                        }
                                        placeholder={`You are a title generator for audio recordings. Generate a concise, descriptive title based on the transcription provided.

RULES (MUST FOLLOW):
1. Maximum 60 characters (strict limit)
2. No quotes, colons, semicolons, or special punctuation marks
3. Use title case (capitalize important words)
4. Focus on the main topic, subject, or action discussed
5. Remove filler words, greetings, and conversational fluff
6. Be specific and descriptive, not generic
7. If the transcription is very short or unclear, create a meaningful title based on context
8. Do not include timestamps, dates, or metadata
9. Do not use phrases like "Recording about" or "Discussion of"
10. Return ONLY the title text, nothing else

Transcription:
{transcription}

Generate the title now:`}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setEditingCustomPrompt(null)
                                        }
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (
                                                !editingCustomPrompt.name ||
                                                !editingCustomPrompt.prompt
                                            ) {
                                                toast.error(
                                                    "名称和提示词为必填项",
                                                );
                                                return;
                                            }
                                            handleSaveCustomPrompt(
                                                editingCustomPrompt,
                                            );
                                        }}
                                        disabled={
                                            !editingCustomPrompt.name ||
                                            !editingCustomPrompt.prompt
                                        }
                                    >
                                        {editingCustomPrompt.id
                                            ? "保存"
                                            : "创建"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <AddProviderDialog
                open={isAddProviderOpen}
                onOpenChange={setIsAddProviderOpen}
                onSuccess={() => {
                    setIsAddProviderOpen(false);
                    refreshProviders();
                }}
            />

            <EditProviderDialog
                open={isEditProviderOpen}
                onOpenChange={(open) => {
                    setIsEditProviderOpen(open);
                    if (!open) {
                        setEditingProvider(null);
                    }
                }}
                provider={editingProvider}
                onSuccess={() => {
                    setIsEditProviderOpen(false);
                    setEditingProvider(null);
                    refreshProviders();
                }}
            />
        </>
    );
}
