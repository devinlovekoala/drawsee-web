# 数字电路仿真后端（Icarus Verilog）

该文档说明如何启动 `server/verilog-sim-server.js`，它封装 `iverilog + vvp` 执行为 “组合逻辑 + 时序逻辑” 数字电路仿真提供统一接口。

## 依赖

1. [Icarus Verilog](https://steveicarus.github.io/iverilog/) (`iverilog`, `vvp`) 安装并在 PATH 中可用，或通过环境变量显式指定路径。
2. Node.js 18+（与前端一致）。

## 启动

```bash
# 使用 PATH 中的 iverilog/vvp
npm run verilog:serve

# 或指定二进制与端口
IVERILOG_BIN=/usr/bin/iverilog \
VVP_BIN=/usr/bin/vvp \
VERILOG_PORT=3002 \
npm run verilog:serve
```

服务默认监听 `http://localhost:3002/simulate/digital`，支持 CORS。

可选环境变量：

| 变量 | 默认值 | 描述 |
| --- | --- | --- |
| `VERILOG_PORT` | `3002` | 监听端口 |
| `IVERILOG_BIN` | `iverilog` | iverilog 二进制路径 |
| `VVP_BIN` | `vvp` | vvp 二进制路径 |
| `DIGITAL_MAX_BODY` | `6mb` | 请求体大小限制 |
| `KEEP_DIGITAL_TEMP` | _未设置_ | 设置任意值后保留临时目录（用于调试） |

## API

- `POST /simulate/digital`

请求体（最小示例）：

```json
{
  "runId": "optional-client-id",
  "topModule": "adder",
  "verilog": "module adder(input a, input b, output sum); assign sum = a ^ b; endmodule;",
  "io": {
    "inputs": [{ "name": "a" }, { "name": "b" }],
    "outputs": [{ "name": "sum" }]
  },
  "testbench": {
    "durationNs": 40,
    "clocks": [],
    "stimuli": [
      { "signal": "a", "at": 5, "value": 1 },
      { "signal": "b", "at": 15, "value": 1 }
    ]
  }
}
```

若不提供 `testbench.code`，服务会根据 `topModule` + `io` + `testbench`/`simulation` 中的 `clocks`、`stimuli` 自动生成 testbench，注入 `$dumpfile` & `$dumpvars`，并返回 VCD 文本：

```json
{
  "runId": "...",
  "success": true,
  "topModule": "adder",
  "io": { "inputs": [...], "outputs": [...] },
  "dumpFile": "waves.vcd",
  "durationNs": 40,
  "compileLog": "",
  "runtimeLog": "",
  "warnings": [],
  "vcd": "....VCD text...."
}
```

当前 `digitalNetlist` 字段仅支持携带 `verilog` + `io` 信息，后续会扩展为真正的 DigitalJS JSON → Verilog 转译器。

## 前端配置

在 Web 端可通过 `.env` 或构建变量配置请求地址：

```
VITE_DIGITAL_SIM_API_URL=http://localhost:3002/simulate/digital
```

也可以统一配置主 API 地址，再让前端自动推导仿真服务地址：

```
VITE_API_BASE_URL=http://42.193.107.127:6868
```

地址解析规则：

- 开发环境：未显式配置时默认访问 `http://localhost:3002/simulate/digital`
- 生产环境：优先使用 `VITE_DIGITAL_SIM_API_URL`
- 生产环境若未设置数字仿真地址，则按 `VITE_API_BASE_URL` 或当前页面主机名自动推导为 `http://<当前主机>:3002/simulate/digital`
- 生产环境若误配置为 `localhost/127.0.0.1`，前端会自动忽略该值，避免打包后仍请求本机回环地址

## 前端使用说明

- 在“电路智能分析”页进入“数字电路工作台”后，画布与元件库会自动切换到 React Flow 驱动的数字模式。
- **数字输入** 元件可以在属性面板中设置 `value` 字段，支持 `0101` 之类的序列，系统会按 10ns 步长依次施加；若仅填写单个 `0/1` 则保持常值。
- **时钟源** 的 `value` 字段可填写 `10ns`、`50` 等数值表示周期，仿真时会自动生成 `always #period/2` 的波形。
- 至少放置一个 **数字输出** 元件才能在仿真面板中看到波形，运行后可下载 `VCD` 文件或在弹窗中查看采样值。
