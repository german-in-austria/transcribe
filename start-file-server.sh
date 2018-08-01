#! /bin/bash
docker run -v /Users/arni/uni/transcribe/nginx/nginx.conf:/etc/nginx/nginx.conf:ro -v /Users/arni/uni/transcribe/static/files:/usr/share/nginx/html:ro -p 8081:80 nginx
