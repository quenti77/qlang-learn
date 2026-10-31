---
title: "Écrire des tests avec qlang-test"
group: "Outils"
---

# Écrire des tests avec qlang-test

`qlang test` lance déjà les `fun test_...()` des fichiers `*_test.q`, avec les `assert_*` du langage. Le paquet
[`qlang-test`](https://github.com/quenti77/qlang-test) y ajoute ce qui rend les tests agréables à écrire et à lire :
des groupes, des phrases, des vérifications chaînables, des jeux de données, des espions, des instantanés et des
rapports pour une CI. Il est écrit en qlang et s'installe seul (il faut `qlang` 0.68 ou plus, pour `Panic.guard`) :

```sh
qlang add test
```

## Un premier fichier

```qlang-ref
import total from "cart.q"
import describe, it, expect, finish from "@test"

describe("Panier", fun()
  it("additionne les prix", fun()
    expect(total([5, 7])).to_be(12)
  end)

  describe("avec une remise", fun()
    it("ne descend jamais sous zéro", fun()
      expect(total([5]) - 20).to_be_less_than(1)
    end)
  end)
end)

fun test_suite()
  finish()
end
```

`qlang test` lance `test_suite`, qui lance les cas et **échoue** si l'un d'eux a échoué. Le rapport montre les
groupes en arbre, la durée de chaque cas, ce qui était attendu et ce qui est arrivé, et **la ligne de ton test**
(pas une ligne de la bibliothèque) :

```
Panier
  ok    additionne les prix (1 ms)
  avec une remise
    FAIL  ne descend jamais sous zéro (0 ms)
          expected -15 to be greater than -1
          at cart_test.q:11

Cases: 1 passed, 1 failed (2 ms)
```

Un cas qui échoue n'arrête pas les autres : chacun tourne dans un `Panic.guard`, donc une vérification ratée, un
`panic`, un `unwrap` d'une erreur ou un index hors limites sont rapportés sur **ce** cas. Sans `qlang test`,
termine le fichier par `main()` et lance-le avec `qlang run` (code de sortie 1 en cas d'échec).

## Les cas et les groupes

| | |
| --- | --- |
| `test(nom, f)`, `it(nom, f)` | un cas |
| `describe(nom, f)` | un groupe (on peut les imbriquer) |
| `skip(nom, f)`, `only(nom, f)`, `todo(nom)` | ne pas lancer / ne lancer que ceux-là / à écrire plus tard |
| `group("lent", f)` | marque les cas de `f` ; `QLANG_TEST_GROUP=lent` ne lance que ceux-là, `QLANG_TEST_SKIP_GROUP=lent` les laisse de côté |
| `before_all`, `after_all`, `before_each`, `after_each` | préparer et ranger, dans un `describe` ou en haut du fichier |
| `it_with("accepte %s", ["a@b.fr", "x@y.com"], fun(m: string) ... end)` | un jeu de données : un cas par élément, nommé d'après lui |

Si un `before_each` échoue, le cas échoue et les suivants tournent quand même ; les `after_each` tournent toujours.

## Les vérifications

`expect(valeur)` puis un verbe, qu'on peut enchaîner :

```qlang-ref
expect(n).to_be_greater_than(1).to_be_less_than(10)
expect(n).never().to_be(3)                     -- never() inverse les suivantes
expect(liste).to_contain(2).to_have_length(3)
expect("bonjour le monde").to_start_with("bon").to_match("m.nde")
expect(resultat).to_be_ok()
expect(fun() panic("boum") end).to_throw_with("boum")
```

`to_be`, `to_equal`, `to_be_greater_than`, `to_be_less_than`, `to_be_at_least`, `to_be_at_most`, `to_be_true`,
`to_be_false`, `to_be_close_to`, `to_be_within`, `to_contain`, `to_have_length`, `to_be_empty`, `to_contain_text`,
`to_start_with`, `to_end_with`, `to_match` (expression régulière), `to_be_none`, `to_be_some`, `to_be_ok`,
`to_be_err`, `to_throw`, `to_throw_with`, `to_match_snapshot`, `to_have_been_called`... Chaque verbe n'existe que
pour les types où il a un sens : `to_contain` pour un tableau, `to_be_ok` pour un `Result`, etc.

## Espions et instantanés

```qlang-ref
let s = spy()
let ajoute = fake2(s, fun(a: int, b: int) -> int a + b end)
ajoute(4, 5)
expect(s).to_have_been_called_times(1).to_have_been_called_with("4, 5")
```

`fake0`, `fake1` et `fake2` enveloppent une fonction : elle fait la même chose et note ses appels.

`expect(valeur).to_match_snapshot()` écrit la valeur dans `__snapshots__/snapshots.snap` la première fois, puis
compare. `QLANG_UPDATE_SNAPSHOTS=1` remplace les instantanés ; avec la variable `CI` définie, un instantané manquant
fait échouer le test (pour qu'un oubli se voie).

## Rapports pour une CI

`QLANG_TEST_JUNIT=rapport.xml` écrit un JUnit XML, `QLANG_TEST_TAP=rapport.tap` un rapport TAP.

## Doubles de traits

Un double de trait est une structure qui l'implémente et note ses appels dans un `Spy` :

```
trait Mailer
  fun send(self, to: string) -> bool
end

struct FakeMailer
  public calls: t.Spy
  public works: bool
end

impl Mailer for FakeMailer
  public fun send(self, to: string) -> bool
    self.calls.calls.push(to)
    self.works
  end
end
```

Il n'y a pas de fabrication automatique : un programme qlang ne peut pas construire un type à l'exécution.

## Groupes et couverture

`qlang test --group lent` (ou `QLANG_TEST_GROUP=lent`) ne lance que les cas marqués par `group("lent", f)`, et
`--skip-group lent` les laisse de côté. `qlang test --coverage` dit, par fichier source, quelles lignes portant une
instruction ont été exécutées et lesquelles ne l'ont pas été (`--coverage-lcov c.info` écrit un fichier LCOV). C'est de
la couverture de lignes, avec l'interpréteur « simple » (plus lent).

## Ce qui n'y est pas

- Les `fun test_...` continuent de marcher, à côté (ils ne sont pas dépréciés).
