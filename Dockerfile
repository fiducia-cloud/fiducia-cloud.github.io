# syntax=docker/dockerfile:1
# Static Astro site image.
FROM node:26-slim@sha256:c0753125a3789977aefe869cbebccf70e3cfd7ea84ca48547458f02e4f1d7146 AS build
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git

ARG INTERFACES_REF=487e470c45ab5851e8f6f3b1dc048fe067fbf408
ARG TEST_CONFIG_REF=825220281fdc16bbf47a035177001d2fe29bdabf
WORKDIR /build
# package-lock.json contains sibling file: dependencies. Fetch only the exact
# requested commits and verify that callers supplied full immutable SHAs.
RUN test "${#INTERFACES_REF}" -eq 40 \
    && test -z "$(printf '%s' "$INTERFACES_REF" | tr -d '0-9a-f')" \
    && test "${#TEST_CONFIG_REF}" -eq 40 \
    && test -z "$(printf '%s' "$TEST_CONFIG_REF" | tr -d '0-9a-f')" \
    && git init --quiet fiducia-interfaces \
    && git -C fiducia-interfaces remote add origin https://github.com/fiducia-cloud/fiducia-interfaces.git \
    && git -C fiducia-interfaces fetch --quiet --depth=1 --no-tags origin "$INTERFACES_REF" \
    && git -C fiducia-interfaces checkout --quiet --detach FETCH_HEAD \
    && test "$(git -C fiducia-interfaces rev-parse HEAD)" = "$INTERFACES_REF" \
    && git init --quiet fiducia-test-config \
    && git -C fiducia-test-config remote add origin https://github.com/fiducia-cloud/fiducia-test-config.git \
    && git -C fiducia-test-config fetch --quiet --depth=1 --no-tags origin "$TEST_CONFIG_REF" \
    && git -C fiducia-test-config checkout --quiet --detach FETCH_HEAD \
    && test "$(git -C fiducia-test-config rev-parse HEAD)" = "$TEST_CONFIG_REF"

WORKDIR /build/fiducia-marketing.web
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG PUBLIC_BASE=/fiducia
RUN PUBLIC_BASE="$PUBLIC_BASE" npm run build

FROM nginx:1.31-alpine@sha256:db35bfc6b2951e7f8a72db5db120288c127ffaeeb4a6d4b95a26fead017d5913
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build --chown=nginx:nginx /build/fiducia-marketing.web/dist /srv/www
USER nginx
EXPOSE 8080

# --- sops: decrypt at `docker run`, never at `docker build` ------------------
# The image carries only CIPHERTEXT (env/enc/<SOPS_ENV>.env.enc) and the sops
# binary. The age key arrives at run time (SOPS_AGE_KEY / SOPS_AGE_KEY_FILE);
# scripts/sops-entrypoint.sh decrypts into the process environment and execs
# the real command, so no plaintext ever lands in a layer or on disk.
# See env/README.md.
ARG SOPS_ENV=local
COPY --chmod=0755 --from=ghcr.io/getsops/sops:v3.10.2-alpine /usr/local/bin/sops /usr/local/bin/sops
COPY --chmod=0755 scripts/sops-entrypoint.sh /usr/local/bin/sops-entrypoint.sh
COPY --chmod=0644 env/enc/${SOPS_ENV}.env.enc /app/secrets/app.env
ENV SOPS_SECRETS_FILE=/app/secrets/app.env

ENTRYPOINT ["/usr/local/bin/sops-entrypoint.sh", "nginx"]
CMD ["-g", "daemon off;"]
