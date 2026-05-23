const { executeQuery } = require('./basexService');

const READ_CACHE_TTL_MS = 15000;
const readCache = new Map();

function getCached(key, loader) {
  const now = Date.now();
  const cached = readCache.get(key);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.value);
  }
  return loader().then((value) => {
    readCache.set(key, { value, expiresAt: now + READ_CACHE_TTL_MS });
    return value;
  });
}

function clearReadCache() {
  readCache.clear();
}

function getDashboardContests() {
  return getCached('dashboard-contests', () => executeQuery(`
    array {
      for $c in doc('club.xml')//concours/concours
      let $cat := doc('club.xml')//categorie[@id = $c/@categorieRef]
      order by xs:date($c/@date) ascending
      return map {
        "id": string($c/@id),
        "titre": string($c/titre),
        "date": string($c/@date),
        "coefficient": number($c/@coefficient),
        "categorie": string($cat/@libelle),
        "partCount": count($c/participants/participant)
      }
    }
  `));
}

function getRegistrationData() {
  return getCached('registration-data', () => executeQuery(`
    map {
      "members": array {
        for $m in doc('club.xml')//membre
        let $cat := doc('club.xml')//categorie[@id = $m/@categorieRef]
        order by $m/nom, $m/prenom
        return map {
          "id": string($m/@id),
          "nom": string($m/nom),
          "prenom": string($m/prenom),
          "catId": string($m/@categorieRef),
          "catLibelle": string($cat/@libelle)
        }
      },
      "contests": array {
        for $c in doc('club.xml')//concours/concours
        let $cat := doc('club.xml')//categorie[@id = $c/@categorieRef]
        order by $c/titre
        return map {
          "id": string($c/@id),
          "titre": string($c/titre),
          "catId": string($c/@categorieRef),
          "catLibelle": string($cat/@libelle)
        }
      }
    }
  `).then((result) => ({ members: result.members || [], contests: result.contests || [] })));
}

function validateRegistration(memberId, contestId) {
  return executeQuery(`
    let $membre := doc('club.xml')//membre[@id=$memberId]
    let $concours := doc('club.xml')//concours[@id=$contestId]
    let $isSameCat := ($membre/@categorieRef = $concours/@categorieRef)
    let $alreadyExists := exists($concours//participant[@membreRef=$memberId])
    return map {
      "isSameCat": $isSameCat,
      "alreadyExists": $alreadyExists,
      "membreNom": concat($membre/prenom, " ", $membre/nom),
      "concoursTitre": string($concours/titre)
    }
  `, false, { memberId, contestId });
}

function addParticipant({ contestId, memberId, complexity, executionTime }) {
  return executeQuery(`
    insert node
      <participant membreRef="{$memberId}">
        <complexite>{xs:integer($complexity)}</complexite>
        <tempsExecution>{xs:integer($executionTime)}</tempsExecution>
      </participant>
    into doc('club.xml')//concours[@id=$contestId]/participants
  `, true, { contestId, memberId, complexity, executionTime }).then((output) => {
    clearReadCache();
    return output;
  });
}

function createMemberForContest({ contestId, nom, prenom, email }) {
  const normalizedNom = (nom || '').trim();
  const normalizedPrenom = (prenom || '').trim();
  const normalizedEmail = (email || '').trim();

  if (!normalizedNom || !normalizedPrenom || !normalizedEmail) {
    throw new Error('Veuillez renseigner nom, prenom et email du nouveau membre.');
  }
  if (normalizedEmail.includes(' ') || !normalizedEmail.includes('@')) {
    throw new Error('Email invalide.');
  }

  return executeQuery(`
    let $contest := doc('club.xml')//concours[@id=$contestId]
    let $catId := string($contest/@categorieRef)
    let $existingEmails := doc('club.xml')//membre/email ! lower-case(normalize-space(string(.)))
    let $targetEmail := lower-case(normalize-space($email))
    let $nextNumber :=
      max((
        0,
        for $m in doc('club.xml')//membre
        return xs:integer(substring-after(string($m/@id), 'M'))
      )) + 1
    return map {
      "contestExists": exists($contest),
      "catId": $catId,
      "emailExists": ($targetEmail = $existingEmails),
      "newId": concat('M', format-integer($nextNumber, '000'))
    }
  `, false, { contestId, email: normalizedEmail }).then((info) => {
    if (!info.contestExists) throw new Error('Concours introuvable.');
    if (info.emailExists) throw new Error('Cet email existe deja.');

    return executeQuery(`
      insert node
        <membre id="{$newId}" categorieRef="{$catId}">
          <nom>{$nom}</nom>
          <prenom>{$prenom}</prenom>
          <email>{$email}</email>
        </membre>
      into doc('club.xml')//membres
    `, true, {
      newId: info.newId,
      catId: info.catId,
      nom: normalizedNom,
      prenom: normalizedPrenom,
      email: normalizedEmail
    }).then(() => {
      clearReadCache();
      return info.newId;
    });
  });
}

function getResultContests() {
  return getCached('result-contests', () => executeQuery(`
    array {
      for $c in doc('club.xml')//concours/concours
      order by $c/titre
      return map {
        "id": string($c/@id),
        "titre": string($c/titre)
      }
    }
  `));
}

function getContestResults(contestId) {
  return getCached(`contest-results:${contestId}`, () => executeQuery(`
    let $c := doc('club.xml')//concours[@id=$contestId]
    let $coeff := xs:decimal($c/@coefficient)
    let $participantsScores :=
      for $part in $c/participants/participant
      let $m := doc('club.xml')//membre[@id=$part/@membreRef]
      let $score := (xs:decimal($part/complexite) + xs:decimal($part/tempsExecution)) * $coeff
      return map {
        "membreRef": string($part/@membreRef),
        "nom": concat($m/prenom, " ", $m/nom),
        "email": string($m/email),
        "complexite": number($part/complexite),
        "tempsExecution": number($part/tempsExecution),
        "score": round($score, 2)
      }
    let $scores := for $p in $participantsScores return $p("score")
    let $maxScore := if (empty($scores)) then 0 else max($scores)
    return map {
      "titre": string($c/titre),
      "coefficient": number($coeff),
      "maxScore": $maxScore,
      "participants": array {
        for $p in $participantsScores
        order by $p("score") descending
        return map {
          "membreRef": $p("membreRef"),
          "nom": $p("nom"),
          "email": $p("email"),
          "complexite": $p("complexite"),
          "tempsExecution": $p("tempsExecution"),
          "score": $p("score"),
          "isWinner": ($p("score") = $maxScore and $maxScore > 0)
        }
      }
    }
  `, false, { contestId }));
}

module.exports = {
  addParticipant,
  createMemberForContest,
  getContestResults,
  getDashboardContests,
  getRegistrationData,
  getResultContests,
  validateRegistration
};
