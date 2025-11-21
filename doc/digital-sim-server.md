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

若未设置，则默认访问 `http://localhost:3002/simulate/digital`。
