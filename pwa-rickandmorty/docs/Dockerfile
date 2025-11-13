FROM nginx:alpine

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia os arquivos da aplicação
COPY . /usr/share/nginx/html/

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]