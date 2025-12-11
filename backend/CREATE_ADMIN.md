# Créer un administrateur

## 🎯 Objectif

Créer rapidement un compte administrateur dans la base de données `webunlock`.

---

## 📋 Méthode rapide : Via phpMyAdmin

1. Ouvrez phpMyAdmin : `http://localhost:8888/phpMyAdmin`
2. Sélectionnez la base de données `webunlock`
3. Cliquez sur l'onglet **"SQL"**
4. Copiez-collez la requête ci-dessous
5. Cliquez sur **"Exécuter"**

---

## 📝 Requête SQL

```sql
-- Créer l'administrateur
-- ⚠️ Le mot de passe "Admin123!@#" est hashé avec bcrypt
INSERT INTO users (
  id,
  email,
  password,
  firstName,
  lastName,
  role,
  status,
  emailVerified,
  createdAt,
  updatedAt
)
SELECT 
  UUID() as id,
  'admin@unlock.fr' as email,
  '$2b$10$/gjn4q59QBUJH.QOA3FdOOT2s6K85qv1C9T/cOYRa2mud/kPBE0W.' as password,
  'Admin' as firstName,
  'Unlock' as lastName,
  'admin' as role,
  'active' as status,
  true as emailVerified,
  NOW() as createdAt,
  NOW() as updatedAt
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@unlock.fr'
);
```

---

## 🔐 Identifiants par défaut

- **Email** : `admin@unlock.fr`
- **Mot de passe** : `Admin123!@#`

⚠️ **Important** : Changez ce mot de passe après la première connexion !

---

## ✅ Vérification

Après exécution, vérifiez que l'admin a été créé :

```sql
SELECT 
  id,
  email,
  firstName,
  lastName,
  role,
  status,
  emailVerified,
  createdAt
FROM users
WHERE email = 'admin@unlock.fr';
```

Vous devriez voir une ligne avec :
- `role` = `'admin'`
- `status` = `'active'`
- `emailVerified` = `true`

---

## 🚀 Alternative : Utiliser le script de seed

Si vous préférez utiliser Node.js :

```bash
cd backend
npm run db:seed
```

Ce script créera automatiquement l'admin avec les identifiants configurés dans `.env`.

---

## 🔧 Générer un nouveau hash de mot de passe

Si vous voulez créer un admin avec un autre mot de passe :

```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('VotreMotDePasse', 10));"
```

Puis remplacez le hash dans la requête SQL ci-dessus.

---

## 📚 Architecture

**Structure simplifiée** :
- Table `users` : informations de base (email, password, firstName, lastName, role, status)
- Le champ `role` est un ENUM : `'user'`, `'admin'`, `'individual'`, `'company'`, `'trainer'`, `'candidate'`
- L'admin n'a pas de profil étendu, seulement un compte dans `users` avec `role = 'admin'`

---

## 🆘 Dépannage

### Erreur : "Table 'users' doesn't exist"
```bash
# Synchroniser la base de données d'abord
cd backend
npm run db:sync
```

### Erreur : "Duplicate entry for key 'email'"
L'admin existe déjà. Vérifiez avec :
```sql
SELECT * FROM users WHERE email = 'admin@unlock.fr';
```

Pour le supprimer et recréer :
```sql
DELETE FROM users WHERE email = 'admin@unlock.fr';
-- Puis réexécutez la requête de création
```

### Erreur : "Cannot connect to MySQL"
- Vérifiez que MAMP est démarré
- Vérifiez le port MySQL dans MAMP (généralement 8889)
- Vérifiez les identifiants dans `.env`

