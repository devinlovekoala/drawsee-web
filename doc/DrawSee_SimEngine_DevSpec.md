# DrawSee 前端电路仿真引擎 — AI 开发工作文档

> **文档用途**：驱动 AI 编码工作流（Cursor / Copilot / Claude Code 等）进行 DrawSee 电路仿真功能的升级开发。
> **对标目标**：[CircuitJS1](https://github.com/pfalstad/circuitjs1) 的实时仿真体验。
> **核心策略**：在 React Flow 画布上集成纯前端 MNA 仿真引擎，替代现有"设计→传输→Ngspice→结果"的批处理模式。
> **Ngspice 后端保留**：作为"高精度验证"模式，与前端实时仿真共存。

---

## 目录

1. [项目背景与目标](#1-项目背景与目标)
2. [架构总览](#2-架构总览)
3. [MNA 仿真引擎规格](#3-mna-仿真引擎规格)
4. [元件 Stamp 实现规格](#4-元件-stamp-实现规格)
5. [仿真主循环规格](#5-仿真主循环规格)
6. [React Flow 集成规格](#6-react-flow-集成规格)
7. [实时可视化渲染规格](#7-实时可视化渲染规格)
8. [Web Worker 并发规格](#8-web-worker-并发规格)
9. [CircuitJS 关键源码对照索引](#9-circuitjs-关键源码对照索引)
10. [分阶段交付物](#10-分阶段交付物)
11. [测试用例规格](#11-测试用例规格)
12. [已知陷阱与约束](#12-已知陷阱与约束)

---

## 1. 项目背景与目标

### 1.1 现状痛点

当前 DrawSee 的仿真流程为批处理模式：

```
用户点击"运行" → 前端序列化网表 → HTTP POST → 后端 Ngspice → 结果返回 → 渲染
延迟：1~5 秒
```

此模式导致：
- 无法实时反馈（调参后需重新提交）
- 后端负载高，无法支撑大量并发用户
- 用户体验远低于 CircuitJS

### 1.2 目标体验

对标 CircuitJS（https://www.falstad.com/circuit/circuitjs.html）：

| 体验指标 | CircuitJS | DrawSee 目标 |
|---|---|---|
| 电路修改后反馈延迟 | < 16ms（即帧） | < 16ms |
| 电流流动动画 | 黄色移动点 | 黄色移动点（相同视觉） |
| 导线电压颜色 | 绿/灰/红 | 绿/灰/红（相同编码） |
| 元件实时参数显示 | hover 显示 V/I/P | 常驻 + hover 详情 |
| 画布内示波器 | 独立 Scope 面板 | 画布内浮动 Scope |
| 后端依赖 | 无 | 无（实时模式）；保留 Ngspice 精确模式 |

### 1.3 技术选择理由

选择纯前端 MNA（Modified Nodal Analysis）方案的原因：

- CircuitJS 使用相同方案，已证明 JS 性能足够（开源 20+ 年）
- 线性电路只需一次 LU 分解，每帧仅更新右侧向量（O(n²)），延迟 < 1ms
- 完全消除后端负载，支持离线使用
- React Flow 的 nodes/edges 结构天然适合网表提取

---

## 2. 架构总览

### 2.1 四层架构

```
┌─────────────────────────────────────────────────────┐
│  Layer 4：实时可视化覆盖层                              │
│  绝对定位 Canvas，叠加在 React Flow 画布之上             │
│  绘制：导线颜色 / 流动点 / 元件数值标注 / Scope 波形      │
├─────────────────────────────────────────────────────┤
│  Layer 3：React Flow 画布层（已有）                     │
│  负责：拖拽 / 连线 / 元件选择 / 参数编辑                  │
│  新增：从 nodes+edges 提取网表 / 接收仿真结果写回          │
├─────────────────────────────────────────────────────┤
│  Layer 2：仿真主循环（useSimLoop Hook）                  │
│  requestAnimationFrame 驱动，每帧推进多个时间步           │
│  桥接 React Flow 数据 ↔ CircuitEngine                  │
├─────────────────────────────────────────────────────┤
│  Layer 1：CircuitEngine（纯 TS 类，无 React 依赖）       │
│  MNA 矩阵构建 / LU 分解求解 / 元件 stamp / doStep       │
│  可移入 Web Worker                                    │
└─────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
React Flow nodes/edges
         │
         ▼ extractNetlist()
    Netlist JSON
         │
         ▼ analyzeCircuit()
    节点编号映射 + 矩阵尺寸
         │
         ▼ stampCircuit()
    MNA 矩阵 [G|B; C|D] + RHS [b]
         │
         ▼ LU 分解（线性电路仅一次）
    LU 因子缓存
         │
    ┌────┴──── 每帧 ────┐
    ▼                   ▼
  runCircuit()      （更新 RHS 即可）
    │
    ▼ LU 回代求解
  solution[]: 各节点电压 + 电流源电流
    │
    ▼
  doStep()：各元件更新内部状态（电容历史电流等）
    │
    ▼
  renderFrame()：写入 Canvas 覆盖层 + node.data.simResult
```

### 2.3 文件结构规划

```
src/
  simulation/
    engine/
      CircuitEngine.ts          # 主引擎类
      MNAMatrix.ts              # 矩阵操作（stamp 方法集合）
      LUSolver.ts               # LU 分解与回代
      elements/
        CircuitElement.ts       # 抽象基类
        ResistorElement.ts
        CapacitorElement.ts
        InductorElement.ts
        VoltageSourceElement.ts
        CurrentSourceElement.ts
        DiodeElement.ts
        LogicGateElement.ts     # 数字逻辑（不走 MNA）
      utils/
        formatValue.ts          # 1234 → "1.23k"
        nodeMapper.ts           # React Flow nodeId → 矩阵行号
    hooks/
      useSimLoop.ts             # RAF 主循环 Hook
      useNetlistExtract.ts      # nodes/edges → Netlist
    renderer/
      CanvasOverlay.tsx         # 覆盖 Canvas 组件
      WireRenderer.ts           # 导线颜色 + 流动点
      ScopeRenderer.ts          # 示波器绘制
      NodeLabelRenderer.ts      # 元件数值标注
    worker/
      sim.worker.ts             # Web Worker 入口
      workerBridge.ts           # 主线程 ↔ Worker 通信
    types/
      netlist.ts                # Netlist 数据类型定义
      simResult.ts              # 仿真结果类型定义
```

---

## 3. MNA 仿真引擎规格

### 3.1 CircuitEngine 类接口

```typescript
// src/simulation/engine/CircuitEngine.ts

export interface CircuitEngineOptions {
  timeStep: number;          // 仿真时间步长，默认 5e-6 秒（5μs）
  maxIterations: number;     // 非线性迭代最大次数，默认 100
  convergenceTol: number;    // 收敛容差，默认 1e-7
  stepsPerFrame: number;     // 每帧运行的时间步数，默认 20
}

export class CircuitEngine {
  // 公开属性
  time: number = 0;                          // 当前仿真时间（秒）
  converged: boolean = false;
  lastError: string | null = null;

  // 核心方法（按调用顺序）
  loadNetlist(netlist: Netlist): void;        // 加载网表，触发 analyzeCircuit
  analyzeCircuit(): void;                     // 构建节点映射，确定矩阵尺寸
  stampCircuit(): void;                       // 所有元件 stamp，LU 分解（线性电路）
  runCircuit(): void;                         // 单步仿真（内部调用 solveMatrix + doStep）
  stepN(n: number): SimResult;               // 运行 n 步，返回当前结果快照
  
  // 查询方法
  getNodeVoltage(nodeId: string): number;
  getElementCurrent(elementId: string): number;
  getElementPower(elementId: string): number;
  getScopeData(nodeId: string, length: number): Float32Array;
  
  // 参数热更新（无需重新 stamp 整个电路）
  updateElementParam(elementId: string, param: string, value: number): void;
  
  // 内部方法（供元件调用）
  stampResistor(nodeA: number, nodeB: number, resistance: number): void;
  stampCurrentSource(nodeA: number, nodeB: number, current: number): void;
  stampVoltageSource(nodeA: number, nodeB: number, vsIndex: number, voltage: number): void;
  getNodeIndex(nodeId: string): number;       // 返回矩阵行号，-1 为地节点
  allocateVoltageSourceIndex(): number;       // 分配电压源额外行
}
```

### 3.2 MNA 矩阵结构

对标 CircuitJS `CirSim.java` 的矩阵组织方式：

```
矩阵维度 = N（非地节点数）+ M（独立电压源数）

       | 节点1  节点2  ...  vs1  vs2 |   RHS
-------|----------------------------|---------
节点1  |  G11   G12       B11  B12 | = b1
节点2  |  G21   G22       B21  B22 | = b2
  ...  |                           |
vs1    |  C11   C12       D11  D12 | = Vs1
vs2    |  C21   C22       D21  D22 | = Vs2

求解后得到：
x = [V1, V2, ..., Ivs1, Ivs2, ...]
      节点电压       电压源电流
```

关键约定（与 CircuitJS 保持一致）：
- **节点 0 = 地（GND）**，不出现在矩阵中（否则矩阵奇异）
- 孤立节点（未连接到地）通过一个大电阻（1e12 Ω）连接到地（`connectUnconnectedNodes`）
- 矩阵使用行主序的一维 Float64Array 存储（提升 cache 命中率）

### 3.3 MNAMatrix 类规格

```typescript
// src/simulation/engine/MNAMatrix.ts

export class MNAMatrix {
  private size: number;
  private data: Float64Array;   // size × size，行主序
  private rhs: Float64Array;    // 右侧向量
  
  // 对应 CircuitJS CirSim.stampMatrix()
  stamp(row: number, col: number, value: number): void {
    if (row < 0 || col < 0) return;  // 地节点直接跳过
    this.data[row * this.size + col] += value;
  }
  
  stampRHS(row: number, value: number): void {
    if (row < 0) return;
    this.rhs[row] += value;
  }
  
  // 清除 RHS（线性电路每帧只需清除 RHS，不重建矩阵）
  clearRHS(): void {
    this.rhs.fill(0);
  }
  
  // 完整清除（电路拓扑变化时）
  clearAll(): void {
    this.data.fill(0);
    this.rhs.fill(0);
  }
}
```

### 3.4 LU 分解规格

```typescript
// src/simulation/engine/LUSolver.ts
// 对标 CircuitJS CirSim.lu_factor() 和 CirSim.lu_solve()

export class LUSolver {
  private lu: Float64Array;       // LU 分解结果（原地）
  private perm: Int32Array;       // 行交换置换数组（部分主元）
  private size: number;

  // 分解（仅线性电路调用一次）
  // 对应 CircuitJS lu_factor()
  factor(matrix: Float64Array, size: number): boolean {
    // 使用 Doolittle 算法 + 部分主元选取
    // 返回 false 表示奇异矩阵（断路或短路）
  }

  // 回代求解（每帧调用）
  // 对应 CircuitJS lu_solve()
  solve(rhs: Float64Array): Float64Array {
    // 前向替换 L·y = b
    // 后向替换 U·x = y
    // 返回解向量
  }
}
```

**性能关键**：对于线性电路（纯 R、线性源），`factor()` 只在 `stampCircuit()` 时调用一次，每帧仅调用 `solve()`。这使得每帧计算量从 O(n³) 降低到 O(n²)。

---

## 4. 元件 Stamp 实现规格

### 4.1 抽象基类

```typescript
// src/simulation/engine/elements/CircuitElement.ts
// 对标 CircuitJS CircuitElm.java

export abstract class CircuitElement {
  id: string;
  nodes: number[];         // 矩阵节点行号（-1 = 地）
  voltage: number[] = [];  // 各端口电压（每步更新）
  current: number = 0;     // 主电流（每步更新）
  power: number = 0;       // 功率（每步更新）

  // 电路拓扑变化时调用一次
  // 对标 CircuitElm.stamp()
  abstract stamp(matrix: MNAMatrix): void;

  // 每个时间步调用（更新 RHS 或非线性迭代）
  // 对标 CircuitElm.doStep()
  abstract doStep(matrix: MNAMatrix, dt: number): void;

  // 从求解结果更新自身电压/电流
  abstract updateFromSolution(solution: Float64Array): void;
}
```

### 4.2 电阻元件

```typescript
// src/simulation/engine/elements/ResistorElement.ts
// 对标 CircuitJS ResistorElm.java

export class ResistorElement extends CircuitElement {
  resistance: number;  // 单位：Ω

  stamp(matrix: MNAMatrix): void {
    const g = 1 / this.resistance;  // 电导
    const [a, b] = this.nodes;      // a=正端节点, b=负端节点（-1=地）
    
    // 对应 CircuitJS CirSim.stampResistor()
    matrix.stamp(a, a, g);
    matrix.stamp(b, b, g);
    matrix.stamp(a, b, -g);
    matrix.stamp(b, a, -g);
  }

  doStep(matrix: MNAMatrix, dt: number): void {
    // 纯电阻无时域状态，doStep 为空
  }

  updateFromSolution(solution: Float64Array): void {
    this.voltage[0] = this.nodes[0] >= 0 ? solution[this.nodes[0]] : 0;
    this.voltage[1] = this.nodes[1] >= 0 ? solution[this.nodes[1]] : 0;
    this.current = (this.voltage[0] - this.voltage[1]) / this.resistance;
    this.power = this.current * (this.voltage[0] - this.voltage[1]);
  }
}
```

### 4.3 独立电压源

```typescript
// src/simulation/engine/elements/VoltageSourceElement.ts
// 对标 CircuitJS VoltageElm.java / ACVoltageElm.java

export class VoltageSourceElement extends CircuitElement {
  voltage: number;      // DC 电压值（V）
  frequency: number;    // AC 频率，0 = DC
  phase: number;        // AC 相位（rad）
  vsIndex: number;      // 在矩阵中分配的额外行号

  stamp(matrix: MNAMatrix): void {
    const [pos, neg] = this.nodes;
    // 对应 CircuitJS CirSim.stampVoltageSource()
    // 添加约束方程行：V_pos - V_neg = Vs
    matrix.stamp(this.vsIndex, pos, 1);
    matrix.stamp(this.vsIndex, neg, -1);
    matrix.stamp(pos, this.vsIndex, 1);
    matrix.stamp(neg, this.vsIndex, -1);
  }

  doStep(matrix: MNAMatrix, dt: number): void {
    // 更新 RHS：当前时刻的电压值（AC 时按频率计算）
    const v = this.frequency === 0
      ? this.voltage
      : this.voltage * Math.sin(2 * Math.PI * this.frequency * engine.time + this.phase);
    matrix.stampRHS(this.vsIndex, v);
  }

  updateFromSolution(solution: Float64Array): void {
    // 电流存储在 vsIndex 对应的解向量位置
    this.current = solution[this.vsIndex];
    this.power = this.current * this.voltage;
  }
}
```

### 4.4 电容元件（后向欧拉离散）

```typescript
// src/simulation/engine/elements/CapacitorElement.ts
// 对标 CircuitJS CapacitorElm.java
// 使用后向欧拉法（Backward Euler）进行时域离散

export class CapacitorElement extends CircuitElement {
  capacitance: number;     // 单位：F
  private geq: number = 0; // 等效电导 = C/dt
  private ieq: number = 0; // 历史电流源（伴随模型）
  private lastVoltage: number = 0;

  stamp(matrix: MNAMatrix): void {
    // 电容第一次 stamp 时占位（geq 在第一个 doStep 确定）
    // 实际 stamp 在 doStep 中完成（因为依赖 dt）
  }

  doStep(matrix: MNAMatrix, dt: number): void {
    const [a, b] = this.nodes;
    
    // 后向欧拉等效：C → 并联 Geq = C/dt 和电流源 Ieq
    this.geq = this.capacitance / dt;
    this.ieq = this.geq * this.lastVoltage;

    // 等效电导 stamp（每帧都需要，因为 geq 可能变化）
    matrix.stamp(a, a, this.geq);
    matrix.stamp(b, b, this.geq);
    matrix.stamp(a, b, -this.geq);
    matrix.stamp(b, a, -this.geq);
    
    // 历史电流源 stamp 到 RHS
    matrix.stampRHS(a, -this.ieq);
    matrix.stampRHS(b, this.ieq);
  }

  updateFromSolution(solution: Float64Array): void {
    const va = this.nodes[0] >= 0 ? solution[this.nodes[0]] : 0;
    const vb = this.nodes[1] >= 0 ? solution[this.nodes[1]] : 0;
    this.lastVoltage = va - vb;
    this.current = this.geq * this.lastVoltage - this.ieq;
    this.power = this.current * this.lastVoltage;
  }
}
```

**注意**：电容使用后向欧拉而非梯形法（Trap），原因是后向欧拉在时间步较大时数值更稳定，CircuitJS 也采用此方式。

### 4.5 电感元件（后向欧拉离散）

```typescript
// src/simulation/engine/elements/InductorElement.ts
// 对标 CircuitJS InductorElm.java

export class InductorElement extends CircuitElement {
  inductance: number;      // 单位：H
  private geq: number = 0; // 等效电导 = dt/L
  private ieq: number = 0; // 历史电流（伴随模型）
  private lastCurrent: number = 0;
  private vsIndex: number = -1;

  stamp(matrix: MNAMatrix): void {
    // 电感用等效受控电流源实现，需要额外行
    // 简化实现：与电容对偶
    const [a, b] = this.nodes;
    this.geq = 1e-4; // 初始占位值，doStep 中更新
  }

  doStep(matrix: MNAMatrix, dt: number): void {
    const [a, b] = this.nodes;
    // 后向欧拉：L → 并联 Geq = dt/L 和电流源 Ieq = lastCurrent
    this.geq = dt / this.inductance;
    this.ieq = this.lastCurrent;
    
    matrix.stamp(a, a, this.geq);
    matrix.stamp(b, b, this.geq);
    matrix.stamp(a, b, -this.geq);
    matrix.stamp(b, a, -this.geq);
    
    matrix.stampRHS(a, -this.ieq);
    matrix.stampRHS(b, this.ieq);
  }

  updateFromSolution(solution: Float64Array): void {
    const va = this.nodes[0] >= 0 ? solution[this.nodes[0]] : 0;
    const vb = this.nodes[1] >= 0 ? solution[this.nodes[1]] : 0;
    const vl = va - vb;
    this.lastCurrent = this.geq * vl + this.ieq;
    this.current = this.lastCurrent;
    this.power = this.current * vl;
  }
}
```

### 4.6 二极管（Newton-Raphson 非线性迭代）

```typescript
// src/simulation/engine/elements/DiodeElement.ts
// 对标 CircuitJS DiodeElm.java
// 使用 Shockley 方程的线性化近似（NR 迭代）

export class DiodeElement extends CircuitElement {
  private readonly VT = 0.025875;     // 热电压 ~26mV at 300K
  private readonly IS = 1e-14;        // 反向饱和电流
  private readonly NF = 1.0;          // 理想因子
  private lastVoltage: number = 0;    // 上一次迭代的端口电压

  stamp(matrix: MNAMatrix): void {
    // 二极管是非线性元件，stamp 仅占位
    // 实际贡献在 doStep 中通过 NR 线性化实现
  }

  doStep(matrix: MNAMatrix, dt: number): void {
    const [a, b] = this.nodes;
    
    // Shockley 方程线性化：
    // I(V) ≈ I(V0) + Geq*(V - V0)
    // 其中 Geq = dI/dV|V0 = IS/(NF*VT) * exp(V0/(NF*VT))
    
    const vd = Math.max(-0.5, Math.min(this.lastVoltage, 0.8)); // 电压钳位防溢出
    const expV = Math.exp(vd / (this.NF * this.VT));
    const geq = (this.IS / (this.NF * this.VT)) * expV;
    const ieq = this.IS * (expV - 1) - geq * vd; // 线性化偏置电流
    
    // 等效线性化元件：并联 Geq 电导 + 独立电流源 Ieq
    matrix.stamp(a, a, geq);
    matrix.stamp(b, b, geq);
    matrix.stamp(a, b, -geq);
    matrix.stamp(b, a, -geq);
    matrix.stampRHS(a, -ieq);
    matrix.stampRHS(b, ieq);
  }

  updateFromSolution(solution: Float64Array): void {
    const va = this.nodes[0] >= 0 ? solution[this.nodes[0]] : 0;
    const vb = this.nodes[1] >= 0 ? solution[this.nodes[1]] : 0;
    this.lastVoltage = va - vb;
    const expV = Math.exp(this.lastVoltage / (this.NF * this.VT));
    this.current = this.IS * (expV - 1);
    this.power = this.current * this.lastVoltage;
  }
}
```

### 4.7 数字逻辑门（不走 MNA）

```typescript
// src/simulation/engine/elements/LogicGateElement.ts
// 数字逻辑不参与 MNA 矩阵，独立事件驱动求解

export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

export class LogicGateElement extends CircuitElement {
  gateType: GateType;
  readonly VOL = 0.0;    // 低电平电压
  readonly VOH = 5.0;    // 高电平电压
  readonly VIL = 1.5;    // 输入低阈值
  readonly VIH = 3.5;    // 输入高阈值

  stamp(matrix: MNAMatrix): void {
    // 输出端用受控电压源实现（也可简化为直接写节点电压）
    // 此处简化：通过 doStep 直接驱动输出节点
  }

  doStep(matrix: MNAMatrix, dt: number): void {
    // 计算输入逻辑值
    const inputs = this.nodes.slice(0, -1).map(n =>
      n >= 0 ? solution[n] > this.VIH : false
    );
    const output = this.computeOutput(inputs);
    const outVoltage = output ? this.VOH : this.VOL;
    
    // 用强电压源驱动输出节点
    matrix.stampRHS(this.nodes[this.nodes.length - 1], outVoltage);
  }

  private computeOutput(inputs: boolean[]): boolean {
    switch (this.gateType) {
      case 'AND':  return inputs.every(v => v);
      case 'OR':   return inputs.some(v => v);
      case 'NOT':  return !inputs[0];
      case 'NAND': return !inputs.every(v => v);
      case 'NOR':  return !inputs.some(v => v);
      case 'XOR':  return inputs.reduce((a, b) => a !== b, false);
      case 'XNOR': return !inputs.reduce((a, b) => a !== b, false);
    }
  }
}
```

---

## 5. 仿真主循环规格

### 5.1 runCircuit() 内部逻辑

```typescript
// 对标 CircuitJS CirSim.updateCircuit()

runCircuit(): void {
  // 1. 清除 RHS（矩阵 G 部分保持不变，若线性）
  this.matrix.clearRHS();
  
  // 2. 每个元件更新 RHS（时域状态推进）
  for (const elem of this.elements) {
    elem.doStep(this.matrix, this.timeStep);
  }
  
  // 3. 非线性元件 NR 迭代（二极管、BJT 等）
  let converged = false;
  for (let iter = 0; iter < this.maxIterations && !converged; iter++) {
    const solution = this.solver.solve(this.matrix.getRHS());
    
    // 检查各非线性元件是否收敛
    converged = this.nonlinearElements.every(elem =>
      elem.checkConvergence(solution, this.convergenceTol)
    );
    
    if (!converged) {
      // 用新解重新线性化非线性元件
      this.matrix.clearNonlinear();
      for (const elem of this.nonlinearElements) {
        elem.updateLinearization(solution);
        elem.stampNonlinear(this.matrix);
      }
    }
  }
  
  // 4. 最终求解
  const solution = this.solver.solve(this.matrix.getRHS());
  
  // 5. 所有元件根据解更新内部状态
  for (const elem of this.elements) {
    elem.updateFromSolution(solution);
  }
  
  // 6. 更新示波器缓冲区
  this.updateScopeBuffers(solution);
  
  // 7. 推进时间
  this.time += this.timeStep;
}
```

### 5.2 useSimLoop Hook 规格

```typescript
// src/simulation/hooks/useSimLoop.ts

export interface SimLoopOptions {
  enabled: boolean;
  stepsPerFrame?: number;      // 默认 20
  timeStep?: number;           // 默认 5e-6 秒
  onFrame?: (result: SimFrameResult) => void;
}

export function useSimLoop(
  netlist: Netlist | null,
  options: SimLoopOptions
): SimLoopReturn {
  const engineRef = useRef<CircuitEngine | null>(null);
  const rafRef = useRef<number>(0);

  // 网表变化时重新构建引擎
  useEffect(() => {
    if (!netlist) return;
    const engine = new CircuitEngine({ timeStep: options.timeStep ?? 5e-6 });
    engine.loadNetlist(netlist);
    engineRef.current = engine;
  }, [netlistHash(netlist)]);  // 仅拓扑变化时重建

  // RAF 主循环
  useEffect(() => {
    if (!options.enabled || !engineRef.current) return;

    const loop = () => {
      const engine = engineRef.current!;
      const stepsPerFrame = options.stepsPerFrame ?? 20;
      
      for (let i = 0; i < stepsPerFrame; i++) {
        engine.runCircuit();
      }
      
      options.onFrame?.(engine.getFrameResult());
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [options.enabled]);

  return {
    engine: engineRef.current,
    isRunning: options.enabled,
    updateParam: (id, param, value) =>
      engineRef.current?.updateElementParam(id, param, value),
  };
}
```

### 5.3 时间步参数选择

| 电路类型 | 推荐 timeStep | stepsPerFrame | 备注 |
|---|---|---|---|
| 纯电阻直流 | 1e-3 秒 | 1 | 无动态过程，步长可大 |
| RC/RL 瞬态 | 1e-6 ~ 1e-5 | 10~50 | 根据 RC 时间常数调整 |
| 音频频率 AC（20Hz~20kHz） | 1e-6 | 20 | 覆盖 20kHz 需 < 25μs |
| 高频 RF（>1MHz） | 1e-8 | 500 | 计算量大，需 Worker |
| 数字电路 | 1e-9 | 不限 | 逻辑门不用 MNA，更快 |

**自适应策略**（对标 CircuitJS）：
```typescript
// 根据电路中最小时间常数自动调整 timeStep
function autoTimeStep(elements: CircuitElement[]): number {
  let minTimeConst = Infinity;
  for (const elem of elements) {
    if (elem instanceof CapacitorElement) {
      // τ = RC，R 取连接节点的等效电阻（简化：取 1kΩ）
      minTimeConst = Math.min(minTimeConst, elem.capacitance * 1000);
    }
    if (elem instanceof InductorElement) {
      minTimeConst = Math.min(minTimeConst, elem.inductance / 1000);
    }
  }
  return Math.min(minTimeConst / 100, 5e-6);  // 时间常数的 1/100，上限 5μs
}
```

---

## 6. React Flow 集成规格

### 6.1 网表提取规格

```typescript
// src/simulation/hooks/useNetlistExtract.ts

export interface NetlistNode {
  id: string;          // React Flow node id
  type: string;        // 'resistor' | 'capacitor' | 'vsource' | ...
  params: Record<string, number>;  // { resistance: 1000, ... }
  ports: string[];     // 按序排列的端口名：['positive', 'negative']
}

export interface NetlistEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
}

export interface Netlist {
  nodes: NetlistNode[];
  edges: NetlistEdge[];
  groundNodeId: string;   // 指定哪个 React Flow node 是地
}

// 从 React Flow 状态提取网表
export function extractNetlist(
  flowNodes: FlowNode[],
  flowEdges: FlowEdge[]
): Netlist {
  // 1. 找到 GND 节点（type === 'ground'）
  // 2. 将 React Flow edges 转换为节点间连接关系
  // 3. 验证：每个非 GND 节点至少有一个连接
  // 4. 返回结构化 Netlist
}

// 节点类型到元件类型的映射
export const NODE_TYPE_MAP: Record<string, string> = {
  'resistor': 'ResistorElement',
  'capacitor': 'CapacitorElement',
  'inductor': 'InductorElement',
  'voltageSource': 'VoltageSourceElement',
  'currentSource': 'CurrentSourceElement',
  'diode': 'DiodeElement',
  'wire': null,           // 导线节点：合并连接节点
  'ground': null,         // GND：映射到矩阵节点 -1
  'logicAnd': 'LogicGateElement:AND',
  'logicOr': 'LogicGateElement:OR',
  'logicNot': 'LogicGateElement:NOT',
};
```

### 6.2 仿真结果写回 React Flow

```typescript
// 每帧将仿真结果写回 React Flow node 的 data 字段
// 使用 React Flow 的 setNodes（注意：只更新 data 字段，不触发布局重算）

export interface SimResultData {
  voltage: number;       // 元件两端电压（V）
  current: number;       // 流过电流（A）
  power: number;         // 瞬时功率（W）
  nodeVoltages: number[]; // 各端口对地电压（V）
  isActive: boolean;     // 是否有电流流过
}

// 在 useSimLoop 的 onFrame 回调中执行
function onFrame(result: SimFrameResult) {
  setNodes(nodes => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      simResult: result.elementResults[node.id] ?? null,
    }
  })));
}
```

**性能注意**：每帧调用 `setNodes` 会触发 React 重渲染。如果电路节点数超过 50 个，应改用 `useRef` + Canvas 直接绘制，避免 React 渲染成为瓶颈。

### 6.3 参数热更新（无需重建引擎）

```typescript
// 用户滚轮调整元件参数时的热更新路径

function handleWheelOnElement(nodeId: string, delta: number) {
  const node = getNode(nodeId);
  const newValue = adjustParamByWheel(node.data.params.resistance, delta);
  
  // 1. 更新 React Flow 节点显示
  updateNodeData(nodeId, { params: { resistance: newValue } });
  
  // 2. 热更新仿真引擎（不重建矩阵，仅修改矩阵中对应元素）
  simEngine.updateElementParam(nodeId, 'resistance', newValue);
  // 内部：清除旧的 stamp，重新 stamp，重做 LU 分解
}
```

---

## 7. 实时可视化渲染规格

### 7.1 Canvas 覆盖层组件

```typescript
// src/simulation/renderer/CanvasOverlay.tsx
// 绝对定位覆盖在 React Flow 的 .react-flow__viewport 上

export const CanvasOverlay: React.FC<{
  simResult: SimFrameResult | null;
  viewport: Viewport;  // React Flow 的 { x, y, zoom }
}> = ({ simResult, viewport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !simResult) return;
    const ctx = canvasRef.current.getContext('2d')!;
    
    // 清除画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 应用 React Flow viewport 变换
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);
    
    // 绘制导线（颜色 + 流动点）
    wireRenderer.render(ctx, simResult);
    
    // 绘制元件数值标注
    nodeLabelRenderer.render(ctx, simResult);
    
    ctx.restore();
  }, [simResult, viewport]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',  // 不拦截鼠标事件
        zIndex: 10,
      }}
    />
  );
};
```

### 7.2 导线颜色编码规格

```typescript
// src/simulation/renderer/WireRenderer.ts
// 对标 CircuitJS 的 drawVoltage() 方法

export class WireRenderer {
  // 电压 → 颜色映射（对标 CircuitJS 原版配色）
  // 绿色=正压，灰色=零，红色=负压
  getVoltageColor(voltage: number, maxVoltage: number): string {
    if (maxVoltage === 0) return '#888888';
    const v = Math.max(-1, Math.min(1, voltage / maxVoltage));
    
    if (v > 0) {
      const g = Math.round(v * 200);
      return `rgb(0, ${g}, 0)`;
    } else if (v < 0) {
      const r = Math.round(-v * 200);
      return `rgb(${r}, 0, 0)`;
    }
    return '#888888';  // 灰色 = 地
  }
  
  // 导线宽度 ∝ 电流大小（对标 CircuitJS）
  getWireWidth(current: number, maxCurrent: number): number {
    const BASE_WIDTH = 2;
    const MAX_WIDTH = 6;
    if (maxCurrent === 0) return BASE_WIDTH;
    const ratio = Math.abs(current) / maxCurrent;
    return BASE_WIDTH + (MAX_WIDTH - BASE_WIDTH) * Math.min(ratio, 1);
  }
  
  render(ctx: CanvasRenderingContext2D, simResult: SimFrameResult): void {
    for (const edge of simResult.edgeResults) {
      const color = this.getVoltageColor(edge.avgVoltage, simResult.maxVoltage);
      const width = this.getWireWidth(edge.current, simResult.maxCurrent);
      
      // 绘制带颜色的导线
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([]);
      this.drawEdgePath(ctx, edge.points);
      ctx.stroke();
      
      // 绘制流动点动画
      this.drawCurrentDots(ctx, edge, simResult.time);
    }
  }
}
```

### 7.3 流动点动画规格

```typescript
// 对标 CircuitJS 的移动黄色点效果
// 实现原理：lineDashOffset 随时间变化

export class CurrentDotRenderer {
  private readonly DOT_SPACING = 16;  // 点间距（像素，画布坐标）
  private readonly DOT_SIZE = 3;      // 点的直径

  draw(
    ctx: CanvasRenderingContext2D,
    edgePath: Point[],
    current: number,
    time: number
  ): void {
    if (Math.abs(current) < 1e-10) return;  // 无电流则不显示
    
    // offset 随时间和电流方向变化
    // current > 0：点从正端流向负端
    const SPEED = 50;  // 像素/秒（仿真时间）
    const offset = (time * SPEED * Math.sign(current)) % this.DOT_SPACING;
    
    ctx.setLineDash([2, this.DOT_SPACING - 2]);
    ctx.lineDashOffset = -offset;
    ctx.strokeStyle = '#FFD700';  // 金黄色，对标 CircuitJS
    ctx.lineWidth = this.DOT_SIZE;
    ctx.lineCap = 'round';
    
    this.drawPath(ctx, edgePath);
    ctx.stroke();
    
    // 重置虚线设置
    ctx.setLineDash([]);
  }
}
```

### 7.4 示波器（Scope）规格

```typescript
// src/simulation/renderer/ScopeRenderer.ts
// 画布内浮动示波器，对标 CircuitJS Scope 面板

export class ScopeChannel {
  nodeId: string;
  color: string;
  buffer: Float32Array;    // 环形缓冲区，存储历史波形数据
  writeIndex: number = 0;
  readonly BUFFER_SIZE = 1024;

  constructor(nodeId: string, color: string) {
    this.buffer = new Float32Array(this.BUFFER_SIZE);
  }

  push(value: number): void {
    this.buffer[this.writeIndex % this.BUFFER_SIZE] = value;
    this.writeIndex++;
  }

  // 获取最近 length 个数据点（时间顺序）
  getRecent(length: number): Float32Array {
    const result = new Float32Array(length);
    const start = this.writeIndex - length;
    for (let i = 0; i < length; i++) {
      result[i] = this.buffer[(start + i + this.BUFFER_SIZE) % this.BUFFER_SIZE];
    }
    return result;
  }
}

export class ScopeRenderer {
  channels: ScopeChannel[] = [];
  
  // 渲染到浮动 Canvas panel（画布内 DOM 叠加）
  render(ctx: CanvasRenderingContext2D, rect: DOMRect): void {
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    // 网格线
    this.drawGrid(ctx, rect);
    
    // 各通道波形
    for (const ch of this.channels) {
      const data = ch.getRecent(rect.width);
      this.drawWaveform(ctx, data, rect, ch.color);
    }
    
    // 通道标签（V/格、时间/格）
    this.drawLabels(ctx, rect);
  }
}
```

---

## 8. Web Worker 并发规格

### 8.1 何时需要 Worker

当以下任一条件满足时，将仿真引擎迁移至 Web Worker：
- 电路节点数 > 30（矩阵尺寸 > 30×30）
- stepsPerFrame > 50（高频仿真）
- 主线程帧率（FPS）下降到 50 以下

### 8.2 Worker 消息协议

```typescript
// src/simulation/worker/sim.worker.ts

// 主线程 → Worker 的消息类型
type WorkerInMessage =
  | { type: 'LOAD_NETLIST'; netlist: Netlist }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'UPDATE_PARAM'; elementId: string; param: string; value: number }
  | { type: 'ADD_SCOPE'; nodeId: string; color: string }
  | { type: 'REMOVE_SCOPE'; nodeId: string };

// Worker → 主线程的消息类型
type WorkerOutMessage =
  | { type: 'FRAME_RESULT'; result: SimFrameResult }
  | { type: 'ERROR'; message: string }
  | { type: 'CONVERGE_FAIL'; time: number };

// Worker 内部主循环（用 setInterval 替代 RAF，因 Worker 无 rAF）
setInterval(() => {
  if (!isRunning || !engine) return;
  
  for (let i = 0; i < stepsPerFrame; i++) {
    engine.runCircuit();
  }
  
  self.postMessage({
    type: 'FRAME_RESULT',
    result: engine.getFrameResult(),
  });
}, 16);  // ~60fps
```

### 8.3 workerBridge 规格

```typescript
// src/simulation/worker/workerBridge.ts
// 主线程侧的 Worker 封装

export class SimWorkerBridge {
  private worker: Worker;
  private onFrame: (result: SimFrameResult) => void;

  constructor(onFrame: (result: SimFrameResult) => void) {
    this.worker = new Worker(
      new URL('./sim.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  loadNetlist(netlist: Netlist): void {
    this.worker.postMessage({ type: 'LOAD_NETLIST', netlist });
  }
  
  start(): void { this.worker.postMessage({ type: 'START' }); }
  stop(): void { this.worker.postMessage({ type: 'STOP' }); }
  
  updateParam(elementId: string, param: string, value: number): void {
    this.worker.postMessage({ type: 'UPDATE_PARAM', elementId, param, value });
  }

  private handleMessage(e: MessageEvent<WorkerOutMessage>): void {
    if (e.data.type === 'FRAME_RESULT') {
      this.onFrame(e.data.result);
    }
  }
}
```

---

## 9. CircuitJS 关键源码对照索引

以下是 DrawSee 各功能点对应的 CircuitJS 源码位置，供 AI 工作流直接参考借鉴。
仓库地址：https://github.com/pfalstad/circuitjs1

| DrawSee 功能 | CircuitJS 源码文件 | 关键方法/类 |
|---|---|---|
| MNA 矩阵构建 | `src/.../CirSim.java` | `stampMatrix()`, `stampRHS()`, `analyzeCircuit()` |
| LU 分解 | `src/.../CirSim.java` | `lu_factor()`, `lu_solve()` |
| 仿真主循环 | `src/.../CirSim.java` | `updateCircuit()`, `runCircuit()` |
| 非线性 NR 迭代 | `src/.../CirSim.java` | `converged` flag, `subIterations` |
| 矩阵简化优化 | `src/.../CirSim.java` | `simplifyMatrix()` |
| 电阻 stamp | `src/.../ResistorElm.java` | `stamp()` |
| 电容 stamp | `src/.../CapacitorElm.java` | `stamp()`, `doStep()` |
| 电感 stamp | `src/.../InductorElm.java` | `stamp()`, `doStep()` |
| 电压源 stamp | `src/.../VoltageElm.java` | `stamp()`, `stampVoltageSource()` |
| AC 电压源 | `src/.../ACVoltageElm.java` | `doStep()` |
| 二极管模型 | `src/.../DiodeElm.java` | `doStep()`, `Diode.java` 内的模型参数 |
| BJT 模型 | `src/.../TransistorElm.java` | Gummel-Poon 简化模型 |
| 数字逻辑 | `src/.../LogicInputElm.java` | 逻辑电平阈值 |
| 电压颜色编码 | `src/.../CircuitElm.java` | `getVoltageColor()` |
| 电流流动点 | `src/.../CircuitElm.java` | `drawDots()`, `curcount` 累积机制 |
| Scope 波形 | `src/.../Scope.java` | `drawScope()`, 环形缓冲区 |
| 节点电压读取 | `src/.../CircuitElm.java` | `volts[]` 数组 |
| 元件内部文档 | `INTERNALS.md` | 完整 MNA 数学推导（必读） |

**INTERNALS.md 是理解 CircuitJS 仿真机制的第一优先级文档**，位于仓库根目录，包含了 stamp 机制的完整数学推导和所有特殊处理的说明。

---

## 10. 分阶段交付物

### Phase 1：基础直流仿真可视化（目标：2周）

**交付标准**：
- [ ] `CircuitEngine` 类能正确求解纯电阻电路（误差 < 0.1%）
- [ ] 支持元件：R, V源（DC）, I源, 导线, GND
- [ ] 仿真结果能在 React Flow 画布上以颜色显示（无动画）
- [ ] 测试用例全部通过（见第11节）

**不包含**：C、L、AC、动画

### Phase 2：动态仿真 + 视觉效果（目标：2周）

**交付标准**：
- [ ] 支持元件新增：C, L, V源（AC/PWM）
- [ ] 流动点动画运行流畅（> 55 FPS）
- [ ] 导线颜色随电压实时变化
- [ ] 元件 hover 显示 V/I/P 数值
- [ ] 用户可滚轮调整 R 值并看到实时响应

**不包含**：非线性器件、示波器

### Phase 3：非线性器件 + 示波器（目标：2周）

**交付标准**：
- [ ] 支持元件新增：Diode, 数字逻辑门（AND/OR/NOT）
- [ ] 示波器：点击任意节点可打开波形显示
- [ ] 示波器支持多通道（最多 4 路）
- [ ] Web Worker 启用（大电路不卡主线程）
- [ ] Ngspice 后端保留为"精确模式"切换入口

### Phase 4：体验打磨（目标：1周）

**交付标准**：
- [ ] 电路连接错误实时提示（断路/短路检测）
- [ ] 仿真速度滑块（对标 CircuitJS 右侧控制面板）
- [ ] 支持暂停/单步调试
- [ ] 支持导出波形数据（CSV）

---

## 11. 测试用例规格

### 11.1 直流电路（Phase 1 必须通过）

```typescript
// 测试 1：欧姆定律
// 电路：12V 电源 → 1kΩ 电阻 → GND
// 期望：节点1电压=12V，电流=12mA，功率=144mW
const test1: Netlist = {
  nodes: [
    { id: 'v1', type: 'voltageSource', params: { voltage: 12 }, ports: ['pos', 'neg'] },
    { id: 'r1', type: 'resistor', params: { resistance: 1000 }, ports: ['a', 'b'] },
    { id: 'gnd', type: 'ground', params: {}, ports: ['gnd'] },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 'v1', sourcePort: 'pos', targetNodeId: 'r1', targetPort: 'a' },
    { id: 'e2', sourceNodeId: 'r1', targetNodeId: 'gnd' },
    { id: 'e3', sourceNodeId: 'v1', sourcePort: 'neg', targetNodeId: 'gnd' },
  ],
  groundNodeId: 'gnd',
};
expect(engine.getNodeVoltage('r1-a')).toBeCloseTo(12, 3);
expect(engine.getElementCurrent('r1')).toBeCloseTo(0.012, 5);

// 测试 2：分压器
// 电路：10V → R1(1kΩ) → R2(1kΩ) → GND
// 期望：中点电压 = 5V
// ...

// 测试 3：并联电阻
// 电路：10V → 并联 R1(1kΩ) 和 R2(2kΩ) → GND
// 等效电阻 = 667Ω，总电流 = 15mA
// ...
```

### 11.2 瞬态电路（Phase 2 必须通过）

```typescript
// 测试 4：RC 充电曲线
// 电路：5V → R(1kΩ) → C(1μF) → GND，初始 C 电压 = 0
// 期望：t=1ms 时电容电压 = 5*(1-e^-1) ≈ 3.16V（误差 < 1%）

// 测试 5：LC 振荡（无阻尼）
// 电路：L(1mH) + C(1μF) 并联（初始 L 电流 = 10mA）
// 期望：振荡频率 ≈ 1/(2π√LC) ≈ 5033 Hz（误差 < 2%）
```

### 11.3 非线性（Phase 3 必须通过）

```typescript
// 测试 6：二极管正向导通
// 电路：1V → R(100Ω) → Diode（阳极到阴极） → GND
// 期望：二极管两端电压 ≈ 0.65V，电流 ≈ 3.5mA

// 测试 7：逻辑门
// AND 门：输入 [HIGH=5V, HIGH=5V] → 输出应 = HIGH=5V
// AND 门：输入 [HIGH=5V, LOW=0V] → 输出应 = LOW=0V
```

---

## 12. 已知陷阱与约束

### 12.1 数值稳定性问题

**问题1：矩阵奇异**
- 原因：存在与地完全断开的孤立节点
- 解决：`connectUnconnectedNodes()`，用 1e12 Ω 电阻连到地
- CircuitJS 参考：`CirSim.java` 的 `connectUnconnectedNodes()` 方法

**问题2：二极管电压溢出**
- 原因：`exp(V/VT)` 在 V > 1V 时数值爆炸（> 1e17）
- 解决：对二极管电压钳位，通常限制在 [-0.5V, 0.8V] 区间
- CircuitJS 参考：`DiodeElm.java` 的电压限制逻辑

**问题3：时间步过大导致振荡**
- 原因：后向欧拉需要 `dt << RC`，否则数值发散
- 解决：检测到发散时自动减半 timeStep
- CircuitJS 参考：`CirSim.java` 的自适应步长机制

**问题4：电感初始电流**
- 原因：电感在 t=0 的初始电流需要单独处理，否则产生冲激
- 解决：第一步用大电阻近似，第二步开始用伴随模型
- CircuitJS 参考：`InductorElm.java` 的 `first` 标志位

### 12.2 React 集成性能约束

**约束1：不要每帧 `setNodes`**
- 节点数 > 20 时，每帧 `setNodes` 会导致 React 重渲染成瓶颈
- 解决：仅将仿真结果写入 Canvas 叠加层，React Flow 节点只在参数编辑时更新

**约束2：Canvas 坐标系同步**
- Canvas 覆盖层需与 React Flow viewport（平移+缩放）保持精确同步
- 解决：监听 `useViewport()` hook，每帧在 Canvas drawcall 前 `ctx.setTransform()`

**约束3：Web Worker 序列化开销**
- `postMessage` 每帧传输大型 Float32Array 有开销
- 解决：使用 `Transferable` 对象（零拷贝传输），或 `SharedArrayBuffer`（需 COOP/COEP 响应头）

### 12.3 CircuitJS 的已知局限（不需复制）

以下是 CircuitJS 的局限，DrawSee **不需要**沿用：
- 所有电路绘制在单一 Canvas 上（DrawSee 用 React Flow，更灵活）
- 没有撤销历史（DrawSee 应自行实现）
- 元件连接方式限制（CircuitJS 只能两端点连线，DrawSee 可以更灵活）

---

## 附录A：Netlist JSON 格式示例

```json
{
  "nodes": [
    {
      "id": "node_v1",
      "type": "voltageSource",
      "params": { "voltage": 12, "frequency": 0, "phase": 0 },
      "ports": ["positive", "negative"]
    },
    {
      "id": "node_r1",
      "type": "resistor",
      "params": { "resistance": 1000 },
      "ports": ["a", "b"]
    },
    {
      "id": "node_c1",
      "type": "capacitor",
      "params": { "capacitance": 1e-6 },
      "ports": ["positive", "negative"]
    },
    {
      "id": "node_gnd",
      "type": "ground",
      "params": {},
      "ports": ["gnd"]
    }
  ],
  "edges": [
    { "id": "e1", "sourceNodeId": "node_v1", "sourcePort": "positive", "targetNodeId": "node_r1", "targetPort": "a" },
    { "id": "e2", "sourceNodeId": "node_r1", "sourcePort": "b", "targetNodeId": "node_c1", "targetPort": "positive" },
    { "id": "e3", "sourceNodeId": "node_c1", "sourcePort": "negative", "targetNodeId": "node_gnd", "targetPort": "gnd" },
    { "id": "e4", "sourceNodeId": "node_v1", "sourcePort": "negative", "targetNodeId": "node_gnd", "targetPort": "gnd" }
  ],
  "groundNodeId": "node_gnd"
}
```

## 附录B：SimFrameResult 类型定义

```typescript
export interface ElementSimResult {
  id: string;
  voltage: number;         // 主端口间电压
  current: number;         // 流过电流（正方向：port[0] → port[1]）
  power: number;           // 瞬时功率（正 = 耗能，负 = 发能）
  nodeVoltages: number[];  // 各端口对地电压
}

export interface EdgeSimResult {
  id: string;
  avgVoltage: number;      // 导线平均电压（用于颜色编码）
  current: number;         // 流过电流（用于流动点速度）
  points: { x: number; y: number }[];  // 导线路径点（画布坐标）
}

export interface SimFrameResult {
  time: number;                                    // 当前仿真时间（秒）
  elementResults: Record<string, ElementSimResult>;
  edgeResults: EdgeSimResult[];
  maxVoltage: number;      // 全局最大电压（用于颜色归一化）
  maxCurrent: number;      // 全局最大电流（用于流动点速度归一化）
  hasError: boolean;
  errorMessage?: string;
}
```

---

*文档版本：1.0.0 | 对标 CircuitJS 仓库：https://github.com/pfalstad/circuitjs1 | INTERNALS.md 为必读文档*
