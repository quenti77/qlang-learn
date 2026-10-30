---
title: "Recettes : le quotidien en qlang"
group: "Guides"
---

# Recettes : le quotidien en qlang

De petits programmes complets, à copier et à adapter. Ceux de cette page marqués « exécutable » tournent
dans ton navigateur (il y a un bouton pour les lancer) ; les recettes qui ont besoin du disque, du réseau
ou de `qlang-std` sont à copier dans un fichier et à lancer avec `qlang`.

## Totaliser une colonne d'un CSV

```qlang
let csv = "nom,prix,quantité\npomme,1.5,4\npoire,2.0,3\nfigue,4.25,2"
let lignes = csv.split("\n")
let total = 0.0
for i in 1..lignes.len() do
  let champs = lignes[i].split(",")
  total += (float.parse(champs[1]) ?? 0.0) * (int.parse(champs[2]) ?? 0) as float
end
print("total : {total}")
```

Pour un vrai fichier avec des guillemets et des virgules dans les champs, utilise `@std/csv.q` : `csv.parse(texte)`
lit le format complet. Pour le disque : `fs.read("ventes.csv")` rend un `Result<string, Error>`.

## Compter les mots

```qlang
let texte = "le chat et le chien et le poisson"
let comptes: map<string, int> = {}
for mot in texte.split(" ") do
  comptes[mot] = (comptes[mot] ?? 0) + 1
end
let mots = comptes.keys()
mots.sort()
for mot in mots do
  print("{mot} : {comptes[mot] ?? 0}")
end
```

`comptes[mot]` rend un `int?` (`none` si la clé n'existe pas) : `?? 0` donne la valeur par défaut.

## Regrouper par première lettre

```qlang
let noms = ["Ada", "Alan", "Grace", "Linus", "Barbara", "Gerald"]
let groupes: map<string, array<string>> = {}
for n in noms do
  let lettre = n.substring(0, 1)
  let liste = groupes[lettre] ?? []
  liste.push(n)
  groupes[lettre] = liste
end
let lettres = groupes.keys()
lettres.sort()
for l in lettres do
  print("{l} : {groupes[l] ?? []}")
end
```

Les tableaux sont des références : `liste.push(n)` modifie le tableau qui est déjà dans le dictionnaire.

## Calculer avec des dates

```qlang
let depart = datetime.of(2026, 10, 11, 14, 30, 0)
print(depart.add_days(30).format("DD/MM/YYYY"))
print(depart.days_until(datetime.of(2026, 12, 25)))
```

Un `datetime` est un instant en UTC. Pour l'heure d'un endroit précis, `Zone.of("Europe/Paris")`
(voir [Fuseaux horaires](../24-temps-identifiants-et-expressions-regulieres/)).

## Extraire avec une expression régulière

```qlang
print(regex.find_all("contact : ada@exemple.fr, alan@exemple.org", "[a-z]+@[a-z.]+"))
```

## Une API en quelques lignes

À copier dans `main.q` et à lancer avec `qlang serve main.q` (après `qlang add std`) :

```qlang-ref
import "@std/web/app.q" as web

let app = web.App.new([])
app.get("/hello/:nom", fun(req: Request) -> Response
  Response.text("Bonjour {req.params["nom"] ?? "?"}")
end)
app.post("/echo", fun(req: Request) -> Response
  Response.json(req.body ?? "{}")
end)

fun handle(req: Request) -> Response
  app.handle(req)
end
```

Chaque worker a sa propre mémoire : pour des données qui doivent durer, utilise une base (`Db.connect`). Le
[guide web](../36-web-demarrer/) construit une vraie API pas à pas, avec la validation, les comptes et les tests.

## Une tâche planifiée

```qlang-ref
import "@std/schedule.q" as sch
import "@std/web/cache.q" as cc

let plan = sch.Schedule.new(cc.Cache.memory())
plan.cron("rapport de nuit", "0 3 * * *", fun() -> string?
  Log.info("le rapport part")
  none
end)
plan.every_minutes("battement", 5, fun() -> string?
  Log.info("toujours là")
  none
end)
plan.work()
```

Une tâche rend `none` quand tout va bien, ou un texte qui dit pourquoi non. `qlang run planifie.q` la lance ; avec
plusieurs machines, donne-lui un cache Redis partagé (`cc.Cache.redis(...)`) pour qu'une tâche ne tourne qu'une
fois par minute (voir [Déployer](../46-deployer/)).

## Envoyer un courriel

```qlang-ref
import "@std/mail.q" as mail

let mailer: mail.Mailer = mail.ResendMailer.new(env.get("RESEND_KEY") ?? "")
let envoye = mailer.send(mail.Mail {
  sender: "Blog <blog@exemple.fr>",
  to: ["ada@exemple.fr"],
  subject: "Bienvenue",
  text: "Bonjour Ada",
})
```

`mail.q` passe par l'API HTTP d'un service (Resend, Postmark, SendGrid, Mailgun), pas par SMTP. Pour les tests,
`MemoryMailer` garde ce qui a été envoyé. Depuis une route, mets l'envoi dans la file de tâches pour qu'un service
lent ne ralentisse pas la réponse. Les détails sont dans la page de [`mail.q`](../54-std-mail/).
