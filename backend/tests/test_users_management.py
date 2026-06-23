import unittest
import urllib.request
import urllib.parse
import http.cookiejar
import json
import time

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        return fp
    def http_error_301(self, req, fp, code, msg, headers):
        return fp
    def http_error_303(self, req, fp, code, msg, headers):
        return fp
    def http_error_307(self, req, fp, code, msg, headers):
        return fp

class TestUsersManagement(unittest.TestCase):
    def setUp(self):
        self.cookie_jar = http.cookiejar.CookieJar()
        self.super_opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar),
            NoRedirectHandler()
        )
        self.login_url = "http://localhost:3131/auth/login"
        self.users_url = "http://localhost:3131/api/users"
        self.invites_url = "http://localhost:3131/api/users/invitations"
        self.register_url = "http://localhost:3131/api/users/register"
        self.me_url = "http://localhost:3131/api/me"

        # Login como Super Admin
        login_data = urllib.parse.urlencode({
            "username": "aryarajmarketing@gmail.com",
            "password": "123456"
        }).encode("utf-8")
        login_req = urllib.request.Request(
            self.login_url, 
            data=login_data, 
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST"
        )
        with self.super_opener.open(login_req, timeout=5) as resp:
            self.assertEqual(resp.status, 302)

    def test_full_users_flow(self):
        """Valida todo o ciclo de vida: convite, registro, autenticação e restrições de permissão"""

        # 1. Super Admin lista usuários (deve conter o Super Admin)
        req_list = urllib.request.Request(self.users_url, method="GET")
        with self.super_opener.open(req_list, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            users = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(len(users) >= 1)
            self.assertEqual(users[0]["id"], "super-admin")
            self.assertTrue(users[0]["isSuperAdmin"])

        # 2. Super Admin cria um convite para "user" com duração de 24 horas
        invite_payload = json.dumps({
            "role": "user",
            "hours": 24
        }).encode("utf-8")
        req_invite = urllib.request.Request(
            self.invites_url,
            data=invite_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with self.super_opener.open(req_invite, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            invite_data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(invite_data["ok"])
            invite_id = invite_data["inviteId"]

        # 3. Verifica convite publicamente
        verify_url = f"{self.invites_url}/{invite_id}/verify"
        req_verify = urllib.request.Request(verify_url, method="GET")
        public_opener = urllib.request.build_opener(NoRedirectHandler())
        with public_opener.open(req_verify, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            verify_data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(verify_data["valid"])
            self.assertEqual(verify_data["role"], "user")

        # 4. Registra novo usuário através do convite
        test_email = f"colaborador-{int(time.time())}@teste.com"
        register_payload = json.dumps({
            "inviteId": invite_id,
            "name": "Colaborador Teste",
            "email": test_email,
            "password": "senha-segura-123"
        }).encode("utf-8")
        req_register = urllib.request.Request(
            self.register_url,
            data=register_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with public_opener.open(req_register, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            register_res = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(register_res["ok"])

        # 5. Verifica que o convite não é mais válido (foi aceito)
        try:
            with public_opener.open(req_verify, timeout=5) as resp:
                self.fail("Deveria ter retornado erro para convite aceito")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)

        # 6. Autentica com o novo colaborador
        user_cookie_jar = http.cookiejar.CookieJar()
        user_opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(user_cookie_jar),
            NoRedirectHandler()
        )
        user_login_data = urllib.parse.urlencode({
            "username": test_email,
            "password": "senha-segura-123"
        }).encode("utf-8")
        user_login_req = urllib.request.Request(
            self.login_url,
            data=user_login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST"
        )
        with user_opener.open(user_login_req, timeout=5) as resp:
            self.assertEqual(resp.status, 302)

        # 7. Novo colaborador chama /api/me e verifica que seu cargo é "user"
        req_me = urllib.request.Request(self.me_url, method="GET")
        with user_opener.open(req_me, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            me_data = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(me_data["email"], test_email)
            self.assertEqual(me_data["role"], "user")
            self.assertFalse(me_data["isSuperAdmin"])

        # 8. Novo colaborador tenta acessar listagem de usuários e recebe 403 (Forbidden)
        req_list_user = urllib.request.Request(self.users_url, method="GET")
        try:
            with user_opener.open(req_list_user, timeout=5) as resp:
                self.fail("Deveria ter bloqueado acesso com 403")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 403)

        # 9. Super Admin edita o novo colaborador no banco
        # Primeiro, descobre o ID gerado para o novo usuário listando eles
        user_id = None
        with self.super_opener.open(req_list, timeout=5) as resp:
            users = json.loads(resp.read().decode("utf-8"))
            for u in users:
                if u["email"] == test_email:
                    user_id = u["id"]
                    break
        
        self.assertIsNotNone(user_id)

        edit_payload = json.dumps({
            "name": "Colaborador Editado",
            "email": test_email,
            "role": "admin" # Promove para admin
        }).encode("utf-8")
        req_edit = urllib.request.Request(
            f"{self.users_url}/{user_id}",
            data=edit_payload,
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        with self.super_opener.open(req_edit, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            edit_res = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(edit_res["ok"])

        # 10. Super Admin tenta editar ou excluir o Super Admin fictício e recebe 400
        req_edit_super = urllib.request.Request(
            f"{self.users_url}/super-admin",
            data=edit_payload,
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        try:
            with self.super_opener.open(req_edit_super, timeout=5) as resp:
                self.fail("Deveria ter rejeitado edição do super-admin")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)

        req_del_super = urllib.request.Request(f"{self.users_url}/super-admin", method="DELETE")
        try:
            with self.super_opener.open(req_del_super, timeout=5) as resp:
                self.fail("Deveria ter rejeitado deleção do super-admin")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)

        # 11. Super Admin exclui o colaborador promovido
        req_del = urllib.request.Request(f"{self.users_url}/{user_id}", method="DELETE")
        with self.super_opener.open(req_del, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            del_res = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(del_res["ok"])

        print("\n[OK] Teste completo de Gestão de Usuários passou com sucesso!")

if __name__ == '__main__':
    unittest.main()
