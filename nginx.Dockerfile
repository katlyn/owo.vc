FROM nginx:alpine

COPY static /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
