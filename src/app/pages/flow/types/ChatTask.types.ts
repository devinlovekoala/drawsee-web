import { NodeVO } from "@/api/types/flow.types";

export type ChatTaskType = 'node' | 'text' | 'title' | 'data' | 'done' | 'error';

export type TextData = {
	nodeId: number;
	content: string;
}

// 当type=node时，data为NodeVO
// 当type=text时，data为TextData
// 当type=title时，data为string
// 当type=data时，data为{
// 	nodeId: number;
// 	[key: string]: unknown;
// }
// 当type=done时，data为""
// 当type=error时，data为string

export type ChatTaskData = NodeVO | TextData | string | {
	nodeId: number;
	[key: string]: unknown;
};

export type ChatTask = {
	type: ChatTaskType;
	data: ChatTaskData;
}