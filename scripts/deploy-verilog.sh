#!/usr/bin/env bash

set -euo pipefail

# Deploy verilog-backend Docker image to a remote host over SSH.
# Assumes Docker is available both locally and remotely.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEPLOY_HOST="${DEPLOY_HOST:-42.193.107.127}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_KEY="${DEPLOY_KEY:-~/.ssh/drawsee_devin.pem}"
IMAGE_TAG="${IMAGE_TAG:-local}"
FORCE_BUILD="${FORCE_BUILD:-false}"
DEPLOY_SU_TO_ROOT="${DEPLOY_SU_TO_ROOT:-true}"

VERILOG_IMAGE="${VERILOG_IMAGE:-drawsee/verilog-backend:${IMAGE_TAG}}"
REMOTE_VERILOG_PORT="${REMOTE_VERILOG_PORT:-3002}"

if [[ -z "${DEPLOY_HOST}" ]]; then
  echo "Set DEPLOY_HOST to the remote server IP/hostname before running." >&2
  exit 1
fi

echo "Building verilog-backend image with tag '${IMAGE_TAG}'..."
if [[ "${FORCE_BUILD}" == "true" ]]; then
  (cd "${ROOT_DIR}" && docker compose build verilog-backend)
else
  if docker image inspect "${VERILOG_IMAGE}" >/dev/null 2>&1; then
    echo "Image '${VERILOG_IMAGE}' already exists; skipping build (set FORCE_BUILD=true to rebuild)."
  else
    (cd "${ROOT_DIR}" && docker compose build verilog-backend)
  fi
fi

_load_cmd="docker load >/dev/null"
_check_cmd="docker image inspect \"${VERILOG_IMAGE}\" >/dev/null 2>&1"
if [[ "${DEPLOY_SU_TO_ROOT}" == "true" ]]; then
  _load_cmd="sudo su - root -c \"docker load >/dev/null\""
  _check_cmd="sudo su - root -c \"${_check_cmd}\""
fi

echo "Checking if '${VERILOG_IMAGE}' exists on ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PORT}..."
if ssh -i "${DEPLOY_KEY}" -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "${_check_cmd}"; then
  echo "Image already exists on remote, skipping transfer."
else
  echo "Transferring '${VERILOG_IMAGE}' to remote..."
  docker save "${VERILOG_IMAGE}" | ssh -i "${DEPLOY_KEY}" -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "${_load_cmd}"
fi

SSH_DEPLOY_SU="${DEPLOY_SU_TO_ROOT}"

echo "Restarting verilog-backend on ${DEPLOY_HOST}..."
ssh -i "${DEPLOY_KEY}" -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" bash <<EOF
set -euo pipefail

run_remote() {
  local cmd="\$1"
  if [[ "${SSH_DEPLOY_SU}" == "true" ]]; then
    sudo su - root -c "\${cmd}"
  else
    eval "\${cmd}"
  fi
}

run_remote "docker rm -f verilog-backend >/dev/null 2>&1 || true"

run_remote "docker run -d \
  --name verilog-backend \
  --restart unless-stopped \
  -p ${REMOTE_VERILOG_PORT}:3002 \
  -e VERILOG_PORT=3002 \
  -e IVERILOG_BIN=/usr/bin/iverilog \
  -e VVP_BIN=/usr/bin/vvp \
  \"${VERILOG_IMAGE}\""

run_remote "docker ps --format \"table {{.Names}}\t{{.Image}}\t{{.Ports}}\""

run_remote "if docker inspect -f '{{.State.Running}}' verilog-backend | grep -q true; then echo 'verilog-backend is running'; else echo 'verilog-backend failed to start' >&2; exit 1; fi"
EOF

echo "Deployment complete."
