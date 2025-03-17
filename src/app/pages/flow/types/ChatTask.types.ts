import { NodeVO } from "@/api/types/flow.types";

export type ChatTaskType = 'node' | 'text' | 'title' | 'media' | 'done' | 'error';

export type TextData = {
	nodeId: number;
	content: string;
}

export type MediaData = {
	nodeId: number;
	animationObjectNames: string[];
	bilibiliUrls: string[];
}

// 当type=node时，data为NodeVO
// 当type=text时，data为TextData
// 当type=title时，data为string
// 当type=media时，data为MediaData
// 当type=done时，data为""
// 当type=error时，data为string

export type ChatTaskData = NodeVO | TextData | string | MediaData;

export type ChatTask = {
	type: ChatTaskType;
	data: ChatTaskData;
}