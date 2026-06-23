FROM nginx:alpine

# Copia a configuração personalizada do Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos do frontend
COPY frontend/ /usr/share/nginx/html/

# Expõe a porta de acesso da interface
EXPOSE 5176

CMD ["nginx", "-g", "daemon off;"]
