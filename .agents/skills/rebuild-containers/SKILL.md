---
name: rebuild-containers-skill
description: Rebuild and recreate docker containers from scratch after any change in the code or visual components of the project.
---

# Reconstrução Completa dos Contêineres

Sempre que terminar de implementar, alterar ou atualizar qualquer funcionalidade, banco de dados ou layout visual (frontend/backend) no projeto, você deve reconstruir do zero e forçar a recriação de todos os contêineres.

## Comando Obrigatório

Execute este comando na raiz do projeto:

```bash
docker compose -f docker/docker-compose-local.yml up -d --build --force-recreate
```

## Protocolo de Execução

1. **Parâmetro `--build`**: Obrigatório para forçar o Vite a compilar a build de produção mais recente do React e inseri-la no Nginx do frontend.
2. **Parâmetro `--force-recreate`**: Garante que contêineres e caches anteriores sejam limpos.
3. **Validação de Boot**: Rode `docker logs --tail 20 oraculo_backend` logo após o restart para confirmar que os serviços estão respondendo e o banco de dados foi inicializado.
