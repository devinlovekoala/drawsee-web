# 远程一键推送 Docker 容器

使用 `scripts/deploy-remote-containers.sh` 可以把本地已构建好的 ngspice、verilog 和 qdrant 容器直接推送到远程服务器并启动运行，无需在服务器手动拉取镜像。

## 前置条件
- 本地与远端都安装了 Docker，且本地可 SSH 直连远端（建议已配置密钥免密登录）。
- 本地已能构建 ngspice/verilog 镜像（仓库自带 Dockerfile）。

## 快速使用
```bash
# 必填：DEPLOY_HOST，其他可按需覆盖。QDRANT_HOST 可指定为另一台服务器。
DEPLOY_HOST=1.2.3.4 \
DEPLOY_USER=ubuntu \
QDRANT_HOST=5.6.7.8 \
QDRANT_USER=root \
IMAGE_TAG=local \
FORCE_BUILD=false \
DEPLOY_SU_TO_ROOT=true \
REMOTE_QDRANT_DATA=/opt/qdrant_data \
./scripts/deploy-remote-containers.sh
```

前端生产构建建议同时配置以下变量，避免把本地 `localhost` 打进产物：

```bash
VITE_API_BASE_URL=http://<你的服务器>:6868
# 如需显式覆盖，也可单独指定
VITE_NGSPICE_API_URL=http://<你的服务器>:3001/simulate
VITE_DIGITAL_SIM_API_URL=http://<你的服务器>:3002/simulate/digital
```

## 主要参数
- `DEPLOY_HOST`：ngspice/verilog 远程服务器 IP/域名（必填）
- `DEPLOY_USER`：SSH 用户，默认 `ubuntu`，脚本默认会在该用户上执行 `sudo su - root -c` 来调用 Docker
- `DEPLOY_PORT`：SSH 端口，默认 `22`
- `QDRANT_HOST`：qdrant 远程服务器，默认与 `DEPLOY_HOST` 相同
- `QDRANT_USER` / `QDRANT_PORT`：qdrant 服务器 SSH 用户/端口，默认跟随 DEPLOY
- `IMAGE_TAG`：ngspice/verilog 镜像标签，默认 `local`
- `FORCE_BUILD`：`true` 时强制重建 ngspice/verilog 镜像；默认 `false`，若本地已存在同名镜像则跳过构建
- `DEPLOY_SU_TO_ROOT`：`true` 时在 `DEPLOY_HOST` 上通过 `sudo su - root -c` 提权执行 Docker 命令，默认 `true`；若直接连 root 可改为 `false`
- `QDRANT_SU_TO_ROOT`：`true` 时在 `QDRANT_HOST` 上通过 `sudo su - root -c` 执行 `docker load`，默认 `false`
- `NGSPICE_IMAGE` / `VERILOG_IMAGE`：如需自定义完整镜像名
- `QDRANT_IMAGE`：默认 `qdrant/qdrant:latest`
- `REMOTE_NGSPICE_PORT` / `REMOTE_VERILOG_PORT`：远端暴露端口，默认 `3001/3002`
- `REMOTE_QDRANT_HTTP_PORT` / `REMOTE_QDRANT_GRPC_PORT`：默认 `6333/6334`
- `REMOTE_QDRANT_DATA`：qdrant 远端数据目录，默认 `/opt/qdrant_data`

## 脚本做了什么
1. 本地执行 `docker compose build` 生成 ngspice/verilog 镜像（标签默认 `local`）。
2. 确保本地存在 `QDRANT_IMAGE`，如无则自动 `docker pull`。
3. 将 ngspice/verilog 镜像流式传输到 `DEPLOY_HOST`，将 qdrant 镜像流式传输到 `QDRANT_HOST`（可同机或不同机器），无需远端访问镜像仓库。
4. 远端各自删除旧容器并重新 `docker run`；脚本会确认 `ngspice-backend`、`verilog-backend` 和 `qdrant` 运行状态，否则报错退出。

## 常见用法
- 更换镜像标签：`IMAGE_TAG=prod DEPLOY_HOST=... ./scripts/deploy-remote-containers.sh`
- 自定义端口：`REMOTE_NGSPICE_PORT=4001 REMOTE_VERILOG_PORT=4002 DEPLOY_HOST=... ./scripts/deploy-remote-containers.sh`
- 指定自建 qdrant 镜像：`QDRANT_IMAGE=my-qdrant:latest DEPLOY_HOST=... ./scripts/deploy-remote-containers.sh`
- qdrant 独立服务器：`DEPLOY_HOST=1.2.3.4 QDRANT_HOST=5.6.7.8 ./scripts/deploy-remote-containers.sh`
- deploy 服务器需用 sudo su root 再执行：`DEPLOY_SU_TO_ROOT=true DEPLOY_HOST=... ./scripts/deploy-remote-containers.sh`
