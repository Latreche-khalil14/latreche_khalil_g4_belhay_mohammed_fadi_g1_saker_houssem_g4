declare variable $categorie external := "Intelligence Artificielle";

(
  <membres>
  {
    for $membre in doc("club.xml")//membre
    let $cat := doc("club.xml")//categorie[@id = $membre/@categorieRef]
    return
      <membre id="{$membre/@id}">
        <nomComplet>{concat($membre/prenom, " ", $membre/nom)}</nomComplet>
        <email>{string($membre/email)}</email>
        <categorie>{string($cat/@libelle)}</categorie>
      </membre>
  }
  </membres>

  ,

  <concours>
  {
    for $concours in doc("club.xml")//concours/concours
    let $cat := doc("club.xml")//categorie[@id = $concours/@categorieRef]
    order by xs:date($concours/@date) ascending
    return
      <concours id="{$concours/@id}" date="{$concours/@date}" coefficient="{$concours/@coefficient}">
        <titre>{string($concours/titre)}</titre>
        <categorie>{string($cat/@libelle)}</categorie>
      </concours>
  }
  </concours>

  ,

  <scores>
  {
    for $concours in doc("club.xml")//concours/concours
    for $part in $concours/participants/participant
    let $membre := doc("club.xml")//membre[@id = $part/@membreRef]
    let $complexite := xs:decimal($part/complexite)
    let $temps := xs:decimal($part/tempsExecution)
    let $coeff := xs:decimal($concours/@coefficient)
    let $score := round(($complexite + $temps) * $coeff, 2)
    return
      <scoreConcours>
        <titreConcours>{string($concours/titre)}</titreConcours>
        <participant>{concat($membre/prenom, " ", $membre/nom)}</participant>
        <complexite>{$complexite}</complexite>
        <tempsExecution>{$temps}</tempsExecution>
        <score>{$score}</score>
      </scoreConcours>
  }
  </scores>

  ,

  <vainqueurs>
  {
    for $concours in doc("club.xml")//concours/concours
    let $participantsScores :=
      for $part in $concours/participants/participant
      let $score := (xs:decimal($part/complexite) + xs:decimal($part/tempsExecution)) * xs:decimal($concours/@coefficient)
      return
        <partScore id="{$part/@membreRef}">
          <score>{$score}</score>
        </partScore>
    let $maxScore := max($participantsScores/score)
    return
      <concours id="{$concours/@id}">
        <titre>{string($concours/titre)}</titre>
        <vainqueurs>
        {
          for $pScore in $participantsScores[score = $maxScore]
          let $membre := doc("club.xml")//membre[@id = $pScore/@id]
          return
            <vainqueur>
              <nom>{string($membre/nom)}</nom>
              <prenom>{string($membre/prenom)}</prenom>
              <score>{round(xs:decimal($pScore/score), 2)}</score>
            </vainqueur>
        }
        </vainqueurs>
      </concours>
  }
  </vainqueurs>

  ,

  <membresCategorie categorie="{$categorie}">
  {
    for $membre in doc("club.xml")//membre
    let $cat := doc("club.xml")//categorie[@id = $membre/@categorieRef]
    where $cat/@libelle = $categorie
    order by $membre/nom, $membre/prenom
    return
      <membre id="{$membre/@id}">
        <nom>{string($membre/nom)}</nom>
        <prenom>{string($membre/prenom)}</prenom>
        <email>{string($membre/email)}</email>
      </membre>
  }
  </membresCategorie>
)
