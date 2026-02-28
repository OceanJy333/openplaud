"use client";

import { Copy, Check, FileText, Languages, Sparkles, Search, X } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recording } from "@/types/recording";

interface Transcription {
    text?: string;
    language?: string;
}

interface TranscriptionPanelProps {
    recording: Recording;
    transcription?: Transcription;
    isTranscribing: boolean;
    onTranscribe: () => void;
}

interface TranscriptSegment {
    speaker: string;
    text: string;
}

const SPEAKER_COLORS = [
    { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
    { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
    { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
    { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
    { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
    { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
];

function parseTranscript(text: string): TranscriptSegment[] {
    const lines = text.split("\n").filter((l) => l.trim());
    const segments: TranscriptSegment[] = [];
    const speakerPattern = /^(.+?):\s+(.+)$/;

    for (const line of lines) {
        const match = line.match(speakerPattern);
        if (match) {
            const speaker = match[1].trim();
            const content = match[2].trim();
            // Merge consecutive lines from same speaker
            const last = segments[segments.length - 1];
            if (last && last.speaker === speaker) {
                last.text += "\n" + content;
            } else {
                segments.push({ speaker, text: content });
            }
        } else {
            // Non-speaker line: append to previous or create anonymous
            const last = segments[segments.length - 1];
            if (last) {
                last.text += "\n" + line.trim();
            } else {
                segments.push({ speaker: "", text: line.trim() });
            }
        }
    }

    return segments;
}

function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark>
        ) : (
            part
        ),
    );
}

export function TranscriptionPanel({
    recording: _recording,
    transcription,
    isTranscribing,
    onTranscribe,
}: TranscriptionPanelProps) {
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const segments = useMemo(
        () => (transcription?.text ? parseTranscript(transcription.text) : []),
        [transcription?.text],
    );

    const speakerColorMap = useMemo(() => {
        const map = new Map<string, (typeof SPEAKER_COLORS)[0]>();
        const speakers = [...new Set(segments.map((s) => s.speaker).filter(Boolean))];
        speakers.forEach((speaker, i) => {
            map.set(speaker, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
        });
        return map;
    }, [segments]);

    const speakerCount = speakerColorMap.size;
    const hasMultipleSpeakers = speakerCount > 1;

    const matchCount = useMemo(() => {
        if (!searchQuery.trim() || !transcription?.text) return 0;
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return (transcription.text.match(new RegExp(escaped, "gi")) || []).length;
    }, [searchQuery, transcription?.text]);

    const handleCopy = useCallback(async () => {
        if (!transcription?.text) return;
        await navigator.clipboard.writeText(transcription.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [transcription?.text]);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        转录文本
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                        {transcription?.text && (
                            <>
                                {showSearch ? (
                                    <div className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="搜索..."
                                            className="bg-transparent text-sm w-32 outline-none placeholder:text-muted-foreground/60"
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {matchCount} 处
                                            </span>
                                        )}
                                        <button
                                            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setShowSearch(true)}
                                    >
                                        <Search className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </>
                        )}
                        {!transcription?.text && !isTranscribing && (
                            <Button
                                onClick={onTranscribe}
                                size="sm"
                                disabled={isTranscribing}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                转录
                            </Button>
                        )}
                    </div>
                </div>
                {transcription?.text && hasMultipleSpeakers && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {[...speakerColorMap.entries()].map(([speaker, colors]) => (
                            <span
                                key={speaker}
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${colors.border} border`} />
                                {speaker}
                            </span>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {isTranscribing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
                        <p className="text-sm text-muted-foreground">
                            正在转录音频...
                        </p>
                    </div>
                ) : transcription?.text ? (
                    <div className="space-y-3">
                        <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
                            {segments.length > 0 && hasMultipleSpeakers ? (
                                segments.map((seg, i) => {
                                    const colors = speakerColorMap.get(seg.speaker);
                                    const prevSpeaker = i > 0 ? segments[i - 1].speaker : null;
                                    const showSpeakerLabel = seg.speaker !== prevSpeaker;

                                    return (
                                        <div
                                            key={i}
                                            className={`group relative pl-3 border-l-2 py-1.5 ${
                                                showSpeakerLabel ? "mt-3 first:mt-0" : ""
                                            } ${colors ? colors.border : "border-gray-200"}`}
                                        >
                                            {showSpeakerLabel && seg.speaker && (
                                                <div
                                                    className={`text-xs font-semibold mb-1 ${
                                                        colors ? colors.text : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {seg.speaker}
                                                </div>
                                            )}
                                            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                {highlightText(seg.text, searchQuery)}
                                            </p>
                                        </div>
                                    );
                                })
                            ) : segments.length > 0 ? (
                                // Single speaker or no speaker labels — clean block layout
                                segments.map((seg, i) => (
                                    <div key={i} className="py-1">
                                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                            {highlightText(seg.text, searchQuery)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                                    {highlightText(transcription.text, searchQuery)}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            {transcription.language && (
                                <div className="flex items-center gap-1">
                                    <Languages className="w-3 h-3" />
                                    <span>语言：{transcription.language}</span>
                                </div>
                            )}
                            {hasMultipleSpeakers && (
                                <div>{speakerCount} 位说话人</div>
                            )}
                            <div>{transcription.text.length} 字</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                            暂无转录文本
                        </p>
                        <Button onClick={onTranscribe} size="sm">
                            <Sparkles className="w-4 h-4 mr-2" />
                            生成转录
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
