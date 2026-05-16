import type { SceneMeta } from './types';
import { BJTLoadLineScene } from './scenes/BJTLoadLine';
import { FreqResponseScene } from './scenes/FreqResponse';
import { GainCompareScene } from './scenes/GainCompare';
import { DFlipFlopTimingScene } from './scenes/DFlipFlopTiming';
import { EmitterFollowerScene } from './scenes/EmitterFollower';
import { SRLatchFSMScene } from './scenes/SRLatchFSM';
import { SyncCounterScene } from './scenes/SyncCounter';
import { KarnaughMapScene } from './scenes/KarnaughMap';
import { DiffAmpCMRRScene } from './scenes/DiffAmpCMRR';
import { SallenKeyScene } from './scenes/SallenKey';
import { AsyncVsSyncScene } from './scenes/AsyncVsSync';

export const SCENES: SceneMeta[] = [
  // P0
  {
    id: 'bjt_load_line',
    title: 'BJT 共射 · Q 点与负载线',
    subtitle: '拖动分压电阻，观察静态工作点在负载线上的动态位置',
    course: 'analog',
    chapter: '第三章 · BJT 放大电路',
    component: BJTLoadLineScene,
  },
  {
    id: 'freq_response',
    title: '滤波器幅频特性',
    subtitle: '调节截止频率与 Q 值，Bode 图实时响应',
    course: 'analog',
    chapter: '第五章 · 滤波器',
    component: FreqResponseScene,
  },
  {
    id: 'gain_compare',
    title: '三种组态增益对比',
    subtitle: '调节 β 和 RC，共射/共基/共集增益范围对比',
    course: 'analog',
    chapter: '第三章 · 放大电路组态',
    component: GainCompareScene,
  },
  {
    id: 'd_ff_timing',
    title: 'D 触发器时序演示',
    subtitle: '逐拍推进时钟，直观演示边沿采样与亚稳态',
    course: 'digital',
    chapter: '第二章 · 触发器',
    component: DFlipFlopTimingScene,
  },
  // P1
  {
    id: 'emitter_follower',
    title: '射极跟随器阻抗变换',
    subtitle: '观察 β 变化对输入/输出阻抗的影响，理解阻抗变换作用',
    course: 'analog',
    chapter: '第三章 · 共集组态',
    component: EmitterFollowerScene,
  },
  {
    id: 'sr_latch_fsm',
    title: 'SR 锁存器状态机',
    subtitle: '交互式 SR 锁存器：设置 S/R 输入，逐拍观察状态转移',
    course: 'digital',
    chapter: '第一章 · 锁存器',
    component: SRLatchFSMScene,
  },
  {
    id: 'sync_counter',
    title: '同步计数器时序波形',
    subtitle: '选择 2/3/4 位，观察各位输出波形及计数真值表',
    course: 'digital',
    chapter: '第三章 · 计数器',
    component: SyncCounterScene,
  },
  {
    id: 'karnaugh_map',
    title: '卡诺图化简演示',
    subtitle: '点击格子填入 1，观察最小项与函数表达式',
    course: 'digital',
    chapter: '第一章 · 逻辑化简',
    component: KarnaughMapScene,
  },
  // P2
  {
    id: 'diff_amp_cmrr',
    title: '差分放大器 CMRR 可视化',
    subtitle: '调节尾电阻，直观观察共模抑制比随参数的变化',
    course: 'analog',
    chapter: '第四章 · 差分放大器',
    component: DiffAmpCMRRScene,
  },
  {
    id: 'sallen_key',
    title: 'Sallen-Key 滤波器参数设计',
    subtitle: '调节 R/C 元件值，实时计算 f₀ 与 Q，观察 Bode 图',
    course: 'analog',
    chapter: '第五章 · 有源滤波器',
    component: SallenKeyScene,
  },
  {
    id: 'async_vs_sync',
    title: '异步 vs 同步计数器对比',
    subtitle: '对比涟漪计数器与同步计数器，可视化竞争冒险区域',
    course: 'digital',
    chapter: '第三章 · 计数器',
    component: AsyncVsSyncScene,
  },
];
