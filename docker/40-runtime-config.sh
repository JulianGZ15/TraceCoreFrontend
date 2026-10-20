#!/bin/sh
set -eu

API_PATH="${API_PATH:-/api/v1}"

case "$API_PATH" in
  /*) ;;
  *) echo "API_PATH debe comenzar con / (por ejemplo /api/v1)." >&2; exit 1 ;;
esac

case "$API_PATH" in
  /) echo "API_PATH debe incluir un prefijo después de / (por ejemplo /api/v1)." >&2; exit 1 ;;
esac

case "$API_PATH" in
  //*|*'?'*|*'#'*|*' '*|*'\\'*|*'"'*|*"'"*|*'<'*|*'>'*|*[!a-zA-Z0-9_./~-]*)
    echo "API_PATH contiene caracteres no permitidos; configura una ruta del mismo origen." >&2
    exit 1
    ;;
esac

case "$API_PATH" in
  *'/../'*|*'/./'*|*/..|*/.)
    echo "API_PATH no puede contener segmentos . o .." >&2
    exit 1
    ;;
esac

while [ "${API_PATH%/}" != "$API_PATH" ]; do
  API_PATH="${API_PATH%/}"
done

printf 'window.__TRACECORE_CONFIG__ = { apiPath: "%s" };\n' "$API_PATH" \
  > /usr/share/nginx/html/runtime-config.js

API_UPSTREAM="${API_UPSTREAM:-}"
if [ -z "$API_UPSTREAM" ]; then
  cat > /etc/nginx/snippets/api-proxy.conf <<EOF
location = ${API_PATH} { return 502; }
location ^~ ${API_PATH}/ { return 502; }
EOF
  echo "API_UPSTREAM está vacío; las solicitudes de API responderán 502 hasta configurar el origen del backend." >&2
  exit 0
fi

case "$API_UPSTREAM" in
  http://*) API_AUTHORITY="${API_UPSTREAM#http://}" ;;
  https://*) API_AUTHORITY="${API_UPSTREAM#https://}" ;;
  *) echo "API_UPSTREAM debe ser un origen http(s), por ejemplo http://tracecore-backend:8080." >&2; exit 1 ;;
esac

case "$API_AUTHORITY" in
  ''|*[!a-zA-Z0-9._:-]*)
    echo "API_UPSTREAM debe contener solo el esquema y el host/puerto, sin ruta, query ni fragmento." >&2
    exit 1
    ;;
esac

cat > /etc/nginx/snippets/api-proxy.conf <<EOF
location = ${API_PATH} { return 308 ${API_PATH}/; }
location ^~ ${API_PATH}/ {
    proxy_pass ${API_UPSTREAM};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_ssl_server_name on;
}
EOF
