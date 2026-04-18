# 电路模拟仿真功能技术说明文档

本文档说明如何在本地启动并调试 DrawSee 项目中的 ngspice 后端，以及在远程服务器上部署的多种方案（`systemd`、`Docker`、反向代理与 TLS 等）。文档包含启动命令、验证方法、`systemd` 示例、`Docker`/`docker-compose` 示例、运维与安全建议以及常见故障排查。

> 关键本地启动命令（示例）：

```bash
NGSPICE_BIN=/home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice PORT=3001 npm run ngspice:serve-local
```

---

## 目录

- 前置条件
- 本地启动（开发/调试）
- 本地故障排查
- 远程部署方案
  - `systemd`（推荐轻量部署）
  - `Docker` / `docker-compose`（容器化部署）
  - Kubernetes（可选，生产级伸缩）
- 反向代理与 TLS（nginx 示例）
- 日志、监控与运维建议
- 安全性建议
- 验证与测试命令汇总
- 快速部署示例（Ubuntu + systemd）

---

## 前置条件

- 操作系统：Linux（例如 Ubuntu / Debian / CentOS）
- Node.js 与 npm：安装并与项目兼容的版本
- 已编译的 `ngspice` 二进制（示例路径：`/home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice`）
- 仓库已克隆到服务器或本机，例如：`/home/devin/Workspace/drawsee-platform/drawsee-web`
- 有 sudo 权限（远程部署需要）

## 一、本地启动（开发/调试）

1. 进入项目目录：

```bash
cd /home/devin/Workspace/drawsee-platform/drawsee-web
```

2. 安装依赖（如尚未安装）：

```bash
npm install
```

3. 校验 ngspice 二进制是否可执行：

```bash
/home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice -v
# 或
NGSPICE_BIN=/home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice $NGSPICE_BIN -v
```

4. 启动后端（开发运行）：

```bash
NGSPICE_BIN=/home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice PORT=3001 npm run ngspice:serve-local
```

说明：
- `NGSPICE_BIN`：指向 ngspice 可执行文件完整路径。
- `PORT`：后端监听端口。
- `npm run ngspice:serve-local`：项目内的 npm 脚本，通常启动 `server/ngspice-server.js` 或等效入口。

5. 观察日志输出：

- 直接在终端可见启动日志；若希望后台运行，可使用 `nohup`、`tmux` 或 `screen`。

6. 测试基本连通性（示例）：

```bash
# 若后端提供 /health 或 /ping
curl -v http://localhost:3001/health

# 测试创建一个任务（请根据后端实际 API 调整请求体）
curl -X POST http://localhost:3001/flow/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"PDF_CIRCUIT_ANALYSIS","prompt":"测试","convId":"local-test"}'
```

---

## 二、本地常见故障排查

- 找不到 `ngspice` 或无权限：
  - 确认路径存在并具有可执行权限：

```bash
ls -l /home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice
chmod +x /home/devin/Workspace/drawsee-platform/ngspice/linux-ubuntu/build/ngspice
```

- 端口被占用：

```bash
ss -ltnp | grep 3001
```

- 资源或安全限制（AppArmor/SELinux）：查看系统日志：

```bash
sudo journalctl -xe
sudo tail -n 200 /var/log/syslog
```

- ngspice 版本或编译选项不支持需求：可运行一个简单的 netlist 检查行为。

---

## 三、远程部署方案

下面给出几种常用部署方法，按从轻量到生产的复杂度排列：`systemd`、`Docker`、`Kubernetes`。

### A. systemd（推荐轻量托管）

适用场景：希望将服务作为系统服务运行，由 systemd 管理自动重启、日志等。

步骤摘要：

1. 在服务器创建运行用户并准备目录：

```bash
sudo useradd -r -s /usr/sbin/nologin drawsee
sudo mkdir -p /opt/drawsee
sudo chown drawsee:drawsee /opt/drawsee
```

2. 将仓库拷贝到 `/opt/drawsee/drawsee-web`，安装依赖（或在 CI 中构建后上传）

3. 将编译好的 ngspice 二进制放置到可访问路径，例如 `/opt/ngspice/bin/ngspice` 并设置权限：

```bash
sudo mkdir -p /opt/ngspice/bin
sudo cp /path/to/local/ngspice /opt/ngspice/bin/ngspice
sudo chown root:root /opt/ngspice/bin/ngspice
sudo chmod 755 /opt/ngspice/bin/ngspice
```

4. 创建 systemd 单元 `/etc/systemd/system/drawsee-ngspice.service`：

```
[Unit]
Description=DrawSee ngspice backend
After=network.target

[Service]
Type=simple
User=drawsee
Group=drawsee
WorkingDirectory=/opt/drawsee/drawsee-web
Environment=NGSPICE_BIN=/opt/ngspice/bin/ngspice
Environment=PORT=3001
ExecStart=/usr/bin/env npm run ngspice:serve-local
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

5. 启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable drawsee-ngspice.service
sudo systemctl start drawsee-ngspice.service
sudo journalctl -u drawsee-ngspice.service -f
```

6. 验证服务：

```bash
curl -v http://127.0.0.1:3001/health
```

### B. Docker / docker-compose（容器化部署）

项目已经内置两份官方 Dockerfile（`docker/Dockerfile.ngspice` 与 `docker/Dockerfile.verilog`）和顶层 `docker-compose.yml`。镜像基于 `node:20-bookworm-slim`，在容器内通过 apt 安装 `ngspice` 或 `iverilog`/`vvp`，再执行 `npm ci --omit=dev`，确保模拟/数字仿真后端都能自包含运行。

**本地（开发环境）**

```bash
# 构建镜像
npm run docker:build
# 前台启动，按 Ctrl+C 停止（生产可加 -d）
npm run docker:up
```

Compose 会同时启动：

- `ngspice-backend`：监听 `3001`，环境变量 `NGSPICE_BIN=/usr/bin/ngspice`
- `verilog-backend`：监听 `3002`，环境变量 `IVERILOG_BIN=/usr/bin/iverilog`、`VVP_BIN=/usr/bin/vvp`

如需修改端口，可设置 `NGSPICE_PORT`、`VERILOG_PORT`（命令行或 `.env`）：

```bash
NGSPICE_PORT=4001 VERILOG_PORT=4002 docker compose up --build
```

`docker-compose.yml` 内置 `curl` 健康检查，并使用 `restart: unless-stopped`。开发调试时，若修改代码可运行 `docker compose up --build` 重新构建，或直接在宿主执行 `npm run ngspice:serve-local` / `npm run verilog:serve-local` 获得更快热重启。

**生产环境**

1. 在 CI/CD 或本机构建并推送镜像：

   ```bash
   docker compose build
   docker tag drawsee/ngspice-backend:local registry.example.com/drawsee/ngspice-backend:prod
   docker push registry.example.com/drawsee/ngspice-backend:prod
   docker tag drawsee/verilog-backend:local registry.example.com/drawsee/verilog-backend:prod
   docker push registry.example.com/drawsee/verilog-backend:prod
   ```

   若需要自定义镜像名称，可修改 `docker-compose.yml` 中的 `image` 字段，或在部署时覆盖。

2. 服务器上拉取并启动：

   ```bash
   docker pull registry.example.com/drawsee/ngspice-backend:prod
   docker pull registry.example.com/drawsee/verilog-backend:prod
   NGSPICE_PORT=3001 VERILOG_PORT=3002 docker compose up -d
   ```

   也可以直接在服务器仓库目录执行 `docker compose up -d --build`，由 Compose 使用源码构建镜像。

3. 通过 `docker compose logs -f`, `docker ps`, `curl http://127.0.0.1:3001/health` 与 `curl http://127.0.0.1:3002/health` 验证运行状态。容器异常退出时会自动重启，可继续结合 systemd/Kubernetes 统一管理。

容器化带来一致的依赖、快速回滚、易于水平扩展；若你仍需使用自编译的 `ngspice` 或 `iverilog`，可以挂载宿主目录并覆盖相关环境变量，镜像本身不做限制。

### C. Kubernetes（可选）

在 k8s 上部署时，建议容器化后写 `Deployment`、`Service`、`Ingress`。注意：

- 将 ngspice 二进制打包入镜像或用 `initContainer` 将二进制放入共享卷。
- 配置 `readinessProbe` 与 `livenessProbe`、资源请求/限制。

---

## 四、反向代理与 TLS（nginx 示例）

建议把 Node 服务绑定为 `127.0.0.1`，使用 nginx 做 TLS 终端并暴露公网域名。

示例 nginx 配置（简化）：

```
server {
  listen 80;
  server_name example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name example.com;

  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
  }

  location /sse/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

获取 Let's Encrypt 证书（Certbot）：

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

---

## 五、日志、监控与运维建议

- `systemd`：使用 `journalctl -u drawsee-ngspice.service -f` 跟踪日志。
- Docker：`docker logs -f <container>` 或 `docker-compose logs -f`。
- 设置监控：Prometheus + Grafana 或轻量级告警（monit）来检测进程存活、队列积压、CPU/内存。
- 在 `systemd` 单元或容器中设置资源限制（`LimitNOFILE`、`LimitNPROC`、容器 `--memory`）以避免滥用。

## 六、安全性建议

- 最小化二进制与数据的访问权限，仅允许运行服务的用户访问 ngspice。
- 将 Node 服务绑定到内网地址，只通过反向代理暴露公网。
- 对上传的 netlist 或用户输入进行严格校验，防止注入或恶意输入导致异常行为。
- 限制单个任务最长执行时间与并发量，避免资源耗尽。

## 七、验证与测试命令

- 检查端口监听：

```bash
ss -ltnp | grep 3001
```

- 用 curl 测试健康接口和创建任务：

```bash
curl -v http://127.0.0.1:3001/health
curl -X POST http://127.0.0.1:3001/flow/tasks -H "Content-Type: application/json" -d '{"type":"PDF_CIRCUIT_ANALYSIS","prompt":"测试"}'
```

- 查看 systemd 日志：

```bash
sudo journalctl -u drawsee-ngspice.service -f
```

- 查看 Docker 日志：

```bash
docker-compose logs -f ngspice-backend
```

## 八、快速部署示例（Ubuntu + systemd）

1. 上传代码并安装依赖：

```bash
sudo useradd -r -s /usr/sbin/nologin drawsee
sudo mkdir -p /opt/drawsee
sudo chown drawsee:drawsee /opt/drawsee
# 假设代码已上传到 /opt/drawsee/drawsee-web
cd /opt/drawsee/drawsee-web
npm ci --production
```

2. 将 ngspice 二进制复制到 `/opt/ngspice/bin/ngspice` 并设置权限（参见上文）。

3. 创建并启动 `systemd` 单元（参见上文示例），然后验证。

## 九、可选改进与扩展

- 将仿真任务抽象为队列（Redis / RabbitMQ + worker），主服务只负责接收请求与返回任务 ID，worker 在独立进程/容器中运行 ngspice，便于限流与重试。
- 为仿真任务增加配额、超时与沙箱机制（容器 / seccomp / chroot）。
- 集成监控告警（任务失败率、队列深度、平均任务耗时）。

---

如果你希望我把此文档提交到 git（创建 commit），或者把示例 `systemd` 单元、`Dockerfile` 与 `docker-compose.yml` 添加到仓库并生成示例提交，请告诉我，我会继续并把对应待办标记为完成。
