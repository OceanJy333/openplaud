"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LEDIndicator } from "@/components/led-indicator";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";

interface TranscriptionSectionProps {
    recordingId: string;
    initialTranscription?: string;
    initialLanguage?: string | null;
    initialType?: string | null;
}

export function TranscriptionSection({
    recordingId,
    initialTranscription,
    initialLanguage,
    initialType,
}: TranscriptionSectionProps) {
    const [transcription, setTranscription] = useState(initialTranscription);
    const [detectedLanguage, setDetectedLanguage] = useState(initialLanguage);
    const [transcriptionType, setTranscriptionType] = useState(initialType);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTranscribe = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch(
                `/api/recordings/${recordingId}/transcribe`,
                {
                    method: "POST",
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                if (
                    response.status === 400 &&
                    errorData.error?.includes("No transcription API")
                ) {
                    toast.error(
                        "请先在设置中配置 AI 服务商",
                    );
                } else {
                    toast.error(errorData.error || "转录失败");
                }
                return;
            }

            const data = await response.json();
            setTranscription(data.transcription);
            setDetectedLanguage(data.detectedLanguage);
            setTranscriptionType("server");
            toast.success("转录完成");
        } catch {
            toast.error("转录失败，请重试。");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Panel>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold">转录内容</h2>
                        {detectedLanguage && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel-inset">
                                <LEDIndicator
                                    active
                                    status="active"
                                    size="sm"
                                />
                                <span className="text-label text-xs">
                                    语言:{" "}
                                    <span className="font-mono uppercase text-accent-cyan">
                                        {detectedLanguage}
                                    </span>
                                </span>
                            </div>
                        )}
                        {transcriptionType && (
                            <span className="text-label text-xs px-3 py-1.5 rounded-lg bg-panel-inset border border-panel-border">
                                {transcriptionType}
                            </span>
                        )}
                    </div>
                    <MetalButton
                        onClick={handleTranscribe}
                        variant="cyan"
                        disabled={isProcessing}
                        className="w-full md:w-auto"
                    >
                        {isProcessing
                            ? "处理中..."
                            : transcription
                              ? "重新转录"
                              : "转录"}
                    </MetalButton>
                </div>

                {transcription ? (
                    <div className="info-card">
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {transcription}
                        </p>
                    </div>
                ) : (
                    <Panel variant="inset" className="text-center py-12">
                        <LEDIndicator
                            active={false}
                            status="active"
                            size="md"
                            className="mx-auto mb-4"
                        />
                        <p className="text-muted-foreground mb-2">
                            暂无转录内容
                        </p>
                        <p className="text-sm text-text-muted">
                            点击"转录"生成转录内容
                        </p>
                    </Panel>
                )}
            </div>
        </Panel>
    );
}
