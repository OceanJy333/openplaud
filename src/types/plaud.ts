/**
 * Plaud API response types
 */

export interface PlaudDevice {
    sn: string;
    name: string;
    model: string;
    version_number: number;
}

export interface PlaudDeviceListResponse {
    status: number;
    msg: string;
    data_devices: PlaudDevice[];
}

export interface PlaudRecording {
    id: string;
    filename: string;
    keywords: string[];
    filesize: number;
    filetype: string;
    fullname: string;
    file_md5: string;
    ori_ready: boolean;
    version: number;
    version_ms: number;
    edit_time: number;
    edit_from: string;
    is_trash: boolean;
    start_time: number; // Unix timestamp in milliseconds
    end_time: number; // Unix timestamp in milliseconds
    duration: number; // Duration in milliseconds
    timezone: number;
    zonemins: number;
    scene: number;
    filetag_id_list: string[];
    serial_number: string;
    is_trans: boolean;
    is_summary: boolean;
}

export interface PlaudRecordingsResponse {
    status: number;
    msg: string;
    data_file_total: number;
    data_file_list: PlaudRecording[];
}

export interface PlaudTempUrlResponse {
    status: number;
    temp_url: string;
    temp_url_opus?: string;
}

export interface PlaudTransSegment {
    content: string;
    start_time: number;
    end_time: number;
    speaker: string;
    original_speaker?: string;
    embeddingKey?: string | null;
}

export interface PlaudContentItem {
    data_id: string;
    data_type: string; // "transaction" | "outline" | "auto_sum_note"
    task_status: number;
    data_title: string;
    data_tab_name: string;
    data_link: string;
    extra?: Record<string, unknown>;
}

export interface PlaudPreDownloadContent {
    data_id: string;
    data_content: string;
}

export interface PlaudFileDetailResponse {
    status: number;
    data: {
        file_id: string;
        file_name: string;
        file_version: number;
        duration: number;
        is_trash: boolean;
        start_time: number;
        scene: number;
        serial_number: string;
        content_list: PlaudContentItem[];
        pre_download_content_list: PlaudPreDownloadContent[];
        extra_data?: Record<string, unknown>;
        [key: string]: unknown;
    };
}

export interface PlaudApiError {
    status: number;
    msg: string;
}
