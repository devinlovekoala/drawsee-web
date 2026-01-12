#!/usr/bin/env bash

set -euo pipefail

# This script streams local Docker images for ngspice, verilog, and qdrant to a
# remote host over SSH, then restarts the containers there. It assumes Docker
# is available both locally and remotely.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEPLOY_HOST="${DEPLOY_HOST:-42.193.107.127}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_KEY="${DEPLOY_KEY:-~/.ssh/drawsee_devin.pem}"
IMAGE_TAG="${IMAGE_TAG:-local}"
FORCE_BUILD="${FORCE_BUILD:-false}"
DEPLOY_SU_TO_ROOT="${DEPLOY_SU_TO_ROOT:-true}"

QDRANT_HOST="${QDRANT_HOST:-117.72.9.87}"
QDRANT_USER="${QDRANT_USER:-root}"
QDRANT_PORT="${QDRANT_PORT:-22}"
QDRANT_KEY="${QDRANT_KEY:-~/.ssh/drawsee-devin.pem}"
QDRANT_SU_TO_ROOT="${QDRANT_SU_TO_ROOT:-false}"

NGSPICE_IMAGE="${NGSPICE_IMAGE:-drawsee/ngspice-backend:${IMAGE_TAG}}"
VERILOG_IMAGE="${VERILOG_IMAGE:-drawsee/verilog-backend:${IMAGE_TAG}}"
QDRANT_IMAGE="${QDRANT_IMAGE:-qdrant/qdrant:latest}"

REMOTE_NGSPICE_PORT="${REMOTE_NGSPICE_PORT:-3001}"
REMOTE_VERILOG_PORT="${REMOTE_VERILOG_PORT:-3002}"
REMOTE_QDRANT_HTTP_PORT="${REMOTE_QDRANT_HTTP_PORT:-6333}"
REMOTE_QDRANT_GRPC_PORT="${REMOTE_QDRANT_GRPC_PORT:-6334}"
REMOTE_QDRANT_DATA="${REMOTE_QDRANT_DATA:-/opt/qdrant_data}"

if [[ -z "${DEPLOY_HOST}" ]]; then
  echo "Set DEPLOY_HOST to the remote server IP/hostname before running." >&2
  exit 1
fi

echo "Building application images (ngspice/verilog) with tag '${IMAGE_TAG}'..."
if [[ "${FORCE_BUILD}" == "true" ]]; then
  (cd "${ROOT_DIR}" && docker compose build ngspice-backend verilog-backend)
else
  if docker image inspect "${NGSPICE_IMAGE}" >/dev/null 2>&1 && docker image inspect "${VERILOG_IMAGE}" >/dev/null 2>&1; then
    echo "Images '${NGSPICE_IMAGE}' and '${VERILOG_IMAGE}' already exist; skipping build (set FORCE_BUILD=true to rebuild)."
  else
    (cd "${ROOT_DIR}" && docker compose build ngspice-backend verilog-backend)
  fi
fi

if ! docker image inspect "${QDRANT_IMAGE}" >/dev/null 2>&1; then
  echo "Pulling qdrant image '${QDRANT_IMAGE}' locally..."
  docker pull "${QDRANT_IMAGE}"
fi

stream_image() {
  local image="$1"
  local host="$2"
  local user="$3"
  local port="$4"
  local key="$5"
  local su_to_root="${6:-false}"
  local load_cmd="docker load >/dev/null"
  local check_cmd="docker image inspect \"${image}\" >/dev/null 2>&1"
  if [[ "${su_to_root}" == "true" ]]; then
    load_cmd="sudo su - root -c \"docker load >/dev/null\""
    check_cmd="sudo su - root -c \"${check_cmd}\""
  fi
  echo "Checking if '${image}' exists on ${user}@${host}:${port}..."
  if ssh -i "${key}" -p "${port}" "${user}@${host}" "${check_cmd}"; then
    echo "Image '${image}' already exists on remote, skipping transfer."
  else
    echo "Transferring '${image}' to ${user}@${host}:${port}..."
    docker save "${image}" | ssh -i "${key}" -p "${port}" "${user}@${host}" "${load_cmd}"
  fi
}

stream_image "${NGSPICE_IMAGE}" "${DEPLOY_HOST}" "${DEPLOY_USER}" "${DEPLOY_PORT}" "${DEPLOY_KEY}" "${DEPLOY_SU_TO_ROOT}"
stream_image "${VERILOG_IMAGE}" "${DEPLOY_HOST}" "${DEPLOY_USER}" "${DEPLOY_PORT}" "${DEPLOY_KEY}" "${DEPLOY_SU_TO_ROOT}"
stream_image "${QDRANT_IMAGE}" "${QDRANT_HOST}" "${QDRANT_USER}" "${QDRANT_PORT}" "${QDRANT_KEY:-${DEPLOY_KEY}}" "${QDRANT_SU_TO_ROOT}"

SSH_DEPLOY_SU="${DEPLOY_SU_TO_ROOT}"

echo "Restarting ngspice/verilog on ${DEPLOY_HOST}..."
ssh -i "${DEPLOY_KEY}" -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash <<EOF
set -euo pipefail

REMOTE_SU_TO_ROOT="${SSH_DEPLOY_SU}"
run_remote() {
  local cmd="\$1"
  if [[ "\${REMOTE_SU_TO_ROOT}" == "true" ]]; then
    sudo su - root -c "\${cmd}"
  else
    eval "\${cmd}"
  fi
}

run_remote "docker rm -f ngspice-backend verilog-backend >/dev/null 2>&1 || true"

run_remote "docker run -d \
  --name ngspice-backend \
  --restart unless-stopped \
  -p ${REMOTE_NGSPICE_PORT}:3001 \
  -e PORT=3001 \
  -e NGSPICE_BIN=/usr/bin/ngspice \
  \"${NGSPICE_IMAGE}\""

run_remote "docker run -d \
  --name verilog-backend \
  --restart unless-stopped \
  -p ${REMOTE_VERILOG_PORT}:3002 \
  -e VERILOG_PORT=3002 \
  -e IVERILOG_BIN=/usr/bin/iverilog \
  -e VVP_BIN=/usr/bin/vvp \
  \"${VERILOG_IMAGE}\""

run_remote "docker ps --format \"table {{.Names}}\t{{.Image}}\t{{.Ports}}\""

run_remote "if docker inspect -f '{{.State.Running}}' ngspice-backend | grep -q true; then echo 'ngspice-backend running'; else echo 'ngspice-backend failed to start' >&2; exit 1; fi"
run_remote "if docker inspect -f '{{.State.Running}}' verilog-backend | grep -q true; then echo 'verilog-backend running'; else echo 'verilog-backend failed to start' >&2; exit 1; fi"
EOF

echo "Restarting qdrant on ${QDRANT_HOST}..."
ssh -i "${QDRANT_KEY}" -p "${QDRANT_PORT}" "${QDRANT_USER}@${QDRANT_HOST}" bash <<EOF
set -euo pipefail

docker rm -f qdrant >/dev/null 2>&1 || true
mkdir -p "${REMOTE_QDRANT_DATA}"

docker run -d \\
  --name qdrant \\
  --restart unless-stopped \\
  -p ${REMOTE_QDRANT_HTTP_PORT}:6333 \\
  -p ${REMOTE_QDRANT_GRPC_PORT}:6334 \\
  -v "${REMOTE_QDRANT_DATA}":/qdrant/storage \\
  "${QDRANT_IMAGE}"

docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
if ! docker inspect -f '{{.State.Running}}' qdrant | grep -q true; then
  echo 'qdrant failed to start' >&2
  exit 1
fi
EOF

echo "Deployment complete."
