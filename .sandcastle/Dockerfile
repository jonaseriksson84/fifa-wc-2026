FROM node:22-bookworm

# Install system dependencies. `tini` is the init we use as PID 1 (see
# ENTRYPOINT below) — without it, agent-spawned children (npm dev, vite,
# playwright firefox) accumulate as zombies because `sleep infinity` never
# reaps. Past runs hit 23+ defunct PIDs which correlated with hangs.
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  tini \
  && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Install Playwright CLI for the agent — browser-control commands designed for
# coding agents (token-efficient alternative to Playwright MCP). Used to
# navigate, snapshot, and screenshot the live dev server so the agent can
# verify frontend work visually before committing.
#
# Per the README, the agent-facing install is just `@playwright/cli`. We also
# install `playwright` globally so the regular `playwright install` command
# is on PATH at image-build time — without it browsers would have to be
# downloaded at first run (~300MB, flaky). `playwright-cli install --skills`
# drops the SKILL.md that Claude Code reads for tool discovery.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
# Firefox (not Chrome) because Google Chrome has no Linux ARM64 build,
# and Apple Silicon hosts produce ARM64 images by default. Of the four
# channels playwright-cli's --browser accepts (chrome/firefox/webkit/msedge),
# only Firefox and WebKit ship for Linux ARM64.
#
# Use playwright-cli's own `install-browser` subcommand — the regular
# `playwright install` puts browsers in a location playwright-cli doesn't
# look in. `playwright-cli install --skills` drops the SKILL.md the
# Claude Code agent reads for tool discovery.
RUN npm install -g @playwright/cli@latest \
  && playwright-cli install-browser firefox --with-deps \
  && playwright-cli install --skills \
  && rm -rf /var/lib/apt/lists/* \
  && chmod -R o+rx /ms-playwright

# Build-args for UID/GID alignment: sandcastle docker build-image
# defaults these to the host user's UID/GID so image-built files
# and bind-mounted files share an owner without runtime chown.
ARG AGENT_UID=1000
ARG AGENT_GID=1000

# Rename the base image's "node" user to "agent" and align UID/GID.
# On macOS the host user is typically GID 20 (the "staff" group), which collides
# with Debian's pre-existing "dialout" group at GID 20. Drop the conflicting
# group first so groupmod can claim that GID for "node".
RUN if getent group $AGENT_GID >/dev/null && [ "$(getent group $AGENT_GID | cut -d: -f1)" != "node" ]; then \
      groupdel "$(getent group $AGENT_GID | cut -d: -f1)"; \
    fi && \
    groupmod -g $AGENT_GID node && \
    usermod -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node
USER ${AGENT_UID}:${AGENT_GID}

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Add Claude to PATH
ENV PATH="/home/agent/.local/bin:$PATH"

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["/usr/bin/tini", "--", "sleep", "infinity"]
