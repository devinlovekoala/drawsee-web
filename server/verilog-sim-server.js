// Digital circuit simulation backend using Icarus Verilog (iverilog + vvp).
// Accepts synthesized Verilog sources or higher-level digital netlists (handled later)
// and returns the generated VCD waveform for the front-end waveform viewer.
import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';

const PORT = process.env.VERILOG_PORT || process.env.DIGITAL_PORT || 3002;
const IVERILOG_BIN = process.env.IVERILOG_BIN || 'iverilog';
const VVP_BIN = process.env.VVP_BIN || 'vvp';
const MAX_BODY_SIZE = process.env.DIGITAL_MAX_BODY || '6mb';

const app = express();
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'verilog-sim-server',
    port: Number(PORT),
    iverilog: IVERILOG_BIN,
    vvp: VVP_BIN,
  });
});

const execFileAsync = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      options,
      (error, stdout, stderr) => {
        if (error) {
          const err = new Error(stderr?.toString() || error.message);
          err.stdout = stdout?.toString();
          err.stderr = stderr?.toString();
          reject(err);
          return;
        }
        resolve({ stdout: stdout?.toString() || '', stderr: stderr?.toString() || '' });
      }
    );
  });

const formatTimescale = (value) => {
  if (!value || typeof value !== 'string') return '1ns/1ps';
  return value;
};

const sanitizeFileName = (name, fallback) => {
  const safeName = (name || '').replace(/[^a-zA-Z0-9_.-]/g, '');
  if (safeName) return safeName;
  return `digital_${fallback}.v`;
};

const literalFromValue = (value, width = 1) => {
  if (typeof value === 'string') {
    if (value.includes("'")) return value;
    if (/^[xXzZ]$/.test(value)) {
      return `${width}'b${value.toLowerCase().repeat(width)}`;
    }
    if (/^[01]+$/.test(value)) {
      return `${width}'b${value}`;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return `${width}'d${num}`;
    }
  }
  if (typeof value === 'number') {
    return `${width}'d${value}`;
  }
  return width === 1 ? "1'b0" : `${width}'d0`;
};

const buildClockBlock = (clock) => {
  const name = clock.signal;
  const period = Number(clock.periodNs || clock.period || 10);
  const halfPeriod = Math.max(period / 2, 1);
  const initial = clock.initial ?? 0;
  const phase = Number(clock.phaseNs || clock.phase || 0);
  const lines = [];
  lines.push(`  initial begin`);
  lines.push(`    ${name} = ${literalFromValue(initial)};`);
  if (phase > 0) {
    lines.push(`    #${phase};`);
  }
  lines.push(`    forever begin`);
  lines.push(`      #${halfPeriod} ${name} = ~${name};`);
  lines.push(`    end`);
  lines.push(`  end`);
  return lines.join('\n');
};

const buildStimulusBlock = (inputs, stimuli = [], durationNs = 1000) => {
  const widthMap = new Map();
  inputs.forEach((port) => {
    widthMap.set(port.name, port.width || 1);
  });
  const lines = [];
  lines.push('  initial begin');
  inputs.forEach((port) => {
    lines.push(`    ${port.name} = ${literalFromValue(port.default ?? 0, port.width || 1)};`);
  });
  const sorted = [...stimuli].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  let cursor = 0;
  sorted.forEach((event) => {
    const target = Math.max(event.at ?? 0, 0);
    const delta = target - cursor;
    if (delta > 0) {
      lines.push(`    #${delta};`);
    }
    cursor = target;
    const width = widthMap.get(event.signal) || event.width || 1;
    lines.push(`    ${event.signal} = ${literalFromValue(event.value, width)};`);
  });
  const remaining = Math.max(durationNs - cursor, 1);
  lines.push(`    #${remaining};`);
  lines.push('    $finish;');
  lines.push('  end');
  return lines.join('\n');
};

const generateTestbench = (topModule, io = {}, config = {}) => {
  const tbModule = config.moduleName || `tb_${topModule}`;
  const dumpFile = (config.dumpfile || 'waves.vcd').replace(/[^A-Za-z0-9_.-]/g, 'waves.vcd');
  const durationNs = Number(config.durationNs || 1000);
  const timescale = formatTimescale(config.timescale);
  const inputs = [...(io.inputs || [])];
  const outputs = [...(io.outputs || [])];
  const inouts = [...(io.inouts || [])];
  (config.clocks || []).forEach((clock) => {
    if (!inputs.some((port) => port.name === clock.signal)) {
      inputs.push({ name: clock.signal, width: 1 });
    }
  });
  const clockBlocks = (config.clocks || []).map((clock) => buildClockBlock(clock));
  const stimulusBlock = buildStimulusBlock(inputs, config.stimuli || [], durationNs);
  const inputDecls = inputs.map((port) => {
    const width = port.width && port.width > 1 ? `[${port.width - 1}:0] ` : '';
    return `  reg ${width}${port.name};`;
  });
  const outputDecls = outputs.map((port) => {
    const width = port.width && port.width > 1 ? `[${port.width - 1}:0] ` : '';
    return `  wire ${width}${port.name};`;
  });
  const inoutDecls = inouts.map((port) => {
    const width = port.width && port.width > 1 ? `[${port.width - 1}:0] ` : '';
    return `  wire ${width}${port.name};`;
  });
  const portMappings = [
    ...inputs,
    ...outputs,
    ...inouts,
  ].map((port) => `    .${port.name}(${port.name})`)
    .join(',\n');

  const tbSource = [
    `\`timescale ${timescale}`,
    '',
    `module ${tbModule};`,
    inputDecls.join('\n'),
    outputDecls.join('\n'),
    inoutDecls.join('\n'),
    '',
    `  ${topModule} dut (`,
    portMappings,
    '  );',
    '',
    '  initial begin',
    `    $dumpfile("${dumpFile}");`,
    config.dumpHierarchy?.length
      ? config.dumpHierarchy.map((scope) => `    $dumpvars(0, ${scope});`).join('\n')
      : '    $dumpvars(0, dut);',
    '  end',
    '',
    clockBlocks.filter(Boolean).join('\n\n'),
    '',
    stimulusBlock,
    '',
    'endmodule',
    '',
  ].join('\n');

  return {
    moduleName: tbModule,
    code: tbSource,
    dumpFile,
    durationNs,
    normalizedIo: { inputs, outputs, inouts },
  };
};

const coerceSourceList = (sources) => {
  if (!sources) return [];
  if (typeof sources === 'string') {
    return [{ filename: 'design_auto.v', content: sources }];
  }
  if (Array.isArray(sources)) {
    return sources
      .filter(Boolean)
      .map((item, idx) => ({
        filename: sanitizeFileName(item.filename || `design_${idx}.v`, idx),
        content: item.content || item.code || '',
      }))
      .filter((item) => item.content?.trim().length);
  }
  if (sources && typeof sources === 'object' && sources.code) {
    return [{ filename: sanitizeFileName(sources.filename || 'design_bundle.v', 0), content: sources.code }];
  }
  return [];
};

const compileDigitalNetlist = (payload) => {
  if (!payload) {
    return null;
  }
  if (typeof payload.verilog === 'string' && payload.verilog.trim()) {
    return {
      filename: payload.filename || 'digital_netlist.v',
      code: payload.verilog,
      topModule: payload.topModule,
      io: payload.io,
    };
  }
  throw new Error('digitalNetlist compilation is not implemented yet');
};

app.post('/simulate/digital', async (req, res) => {
  const runId = req.body?.runId || randomUUID();
  const payload = req.body || {};

  let tmpDir;
  try {
    let sources = coerceSourceList(payload.verilogSources || payload.sources || payload.verilog);
    let topModule = payload.topModule;
    let io = payload.io || { inputs: [], outputs: [], inouts: [] };

    if (payload.digitalNetlist) {
      const compiled = compileDigitalNetlist(payload.digitalNetlist);
      if (compiled) {
        sources = [...sources, { filename: compiled.filename, content: compiled.code }];
        topModule = compiled.topModule || topModule;
        io = compiled.io || io;
      }
    }

    if (!sources.length) {
      throw new Error('No Verilog sources provided. Provide `verilogSources`, `verilog`, or `digitalNetlist`.');
    }

    if (!topModule) {
      throw new Error('`topModule` is required to instantiate the DUT.');
    }

    const tbResult = payload.testbench?.code
      ? {
          moduleName: payload.testbench.moduleName || payload.testbench.name || `tb_${topModule}`,
          code: payload.testbench.code,
          dumpFile: payload.testbench.dumpfile || 'waves.vcd',
          durationNs: payload.testbench.durationNs || payload.testbench.duration || 1000,
        }
      : generateTestbench(topModule, io, payload.testbench || payload.simulation || {});

    if (tbResult.normalizedIo) {
      io = tbResult.normalizedIo;
    }

    sources.push({
      filename: `${tbResult.moduleName}.v`,
      content: tbResult.code,
    });

    tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'iverilog-'));

    const files = [];
    for (let i = 0; i < sources.length; i++) {
      const file = sources[i];
      const filePath = path.join(tmpDir, sanitizeFileName(file.filename, i));
      await fs.writeFile(filePath, file.content, 'utf8');
      files.push(filePath);
    }

    const outputPath = path.join(tmpDir, 'sim.out');
    const compileArgs = ['-o', outputPath, '-g2012', '-s', tbResult.moduleName, ...files];
    const compileResult = await execFileAsync(IVERILOG_BIN, compileArgs, { cwd: tmpDir, timeout: 15000 });

    const runResult = await execFileAsync(VVP_BIN, [outputPath], { cwd: tmpDir, timeout: 15000 });

    const vcdPath = path.join(tmpDir, tbResult.dumpFile);
    const vcdContent = await fs.readFile(vcdPath, 'utf8');

    res.json({
      runId,
      success: true,
      compileLog: compileResult.stdout,
      runtimeLog: runResult.stdout,
      warnings: compileResult.stderr || runResult.stderr ? [compileResult.stderr, runResult.stderr].filter(Boolean) : [],
      durationNs: tbResult.durationNs,
      dumpFile: tbResult.dumpFile,
      vcd: vcdContent,
      topModule,
      io,
    });
  } catch (error) {
    res.status(500).json({
      runId,
      success: false,
      error: error.message || 'Digital simulation failed',
      stderr: error.stderr,
      stdout: error.stdout,
    });
  } finally {
    if (tmpDir && !process.env.KEEP_DIGITAL_TEMP) {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to clean temp dir', cleanupError);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Verilog simulator listening on http://localhost:${PORT}`);
  console.log(`Using iverilog: ${IVERILOG_BIN}, vvp: ${VVP_BIN}`);
});
