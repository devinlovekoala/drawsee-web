import type { ComponentType } from 'react';

export interface SceneMeta {
  id: string;
  title: string;
  subtitle: string;
  course: 'analog' | 'digital';
  chapter: string;
  component: ComponentType;
}
