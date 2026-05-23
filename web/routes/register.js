const express = require('express');
const router = express.Router();
const {
  addParticipant,
  createMemberForContest,
  getRegistrationData,
  validateRegistration
} = require('../services/clubService');

function parseRegistrationForm(body) {
  const { contestId, memberId, complexity, executionTime, isNewMember, newNom, newPrenom, newEmail } = body;
  const complexityRaw = complexity == null ? '' : String(complexity).trim();
  const executionTimeRaw = executionTime == null ? '' : String(executionTime).trim();
  const parsedComplexity = Number.parseInt(complexityRaw, 10);
  const parsedExecutionTime = Number.parseInt(executionTimeRaw, 10);
  const usingNewMember = isNewMember === 'on';

  if (!contestId || complexityRaw === '' || executionTimeRaw === '') {
    return { error: 'Veuillez remplir tous les champs du formulaire.' };
  }
  if (!usingNewMember && !memberId) {
    return { error: 'Veuillez choisir un membre existant ou activer "Nouveau membre".' };
  }
  if (usingNewMember && (!newNom || !newPrenom || !newEmail)) {
    return { error: 'Veuillez renseigner nom, prenom et email du nouveau membre.' };
  }
  if (Number.isNaN(parsedComplexity) || parsedComplexity < 0 || parsedComplexity > 100) {
    return { error: 'La complexite doit etre un entier entre 0 et 100.' };
  }
  if (Number.isNaN(parsedExecutionTime) || parsedExecutionTime <= 0) {
    return { error: "Le temps d'execution doit etre un entier strictement positif (> 0)." };
  }

  return {
    contestId,
    memberId,
    isNewMember: usingNewMember,
    newNom: (newNom || '').trim(),
    newPrenom: (newPrenom || '').trim(),
    newEmail: (newEmail || '').trim(),
    complexity: parsedComplexity,
    executionTime: parsedExecutionTime
  };
}

router.get('/', async (req, res) => {
  try {
    const { members, contests } = await getRegistrationData();
    res.render('register', { members, contests, success: null, error: null, activeTab: 'register' });
  } catch (err) {
    res.render('register', { members: [], contests: [], success: null, error: err.toString(), activeTab: 'register' });
  }
});

router.post('/', async (req, res) => {
  let members = [];
  let contests = [];

  try {
    ({ members, contests } = await getRegistrationData());
  } catch (err) {
    return res.render('register', { members, contests, success: null, error: err.toString(), activeTab: 'register' });
  }

  const form = parseRegistrationForm(req.body);
  if (form.error) {
    return res.render('register', { members, contests, success: null, error: form.error, activeTab: 'register' });
  }

  try {
    let effectiveMemberId = form.memberId;
    if (form.isNewMember) {
      effectiveMemberId = await createMemberForContest({
        contestId: form.contestId,
        nom: form.newNom,
        prenom: form.newPrenom,
        email: form.newEmail
      });
      ({ members, contests } = await getRegistrationData());
    }

    const validation = await validateRegistration(effectiveMemberId, form.contestId);

    if (!validation.isSameCat) {
      return res.render('register', {
        members,
        contests,
        success: null,
        error: 'Action non autorisee : Le membre appartient a une categorie differente de celle du concours.',
        activeTab: 'register'
      });
    }

    if (validation.alreadyExists) {
      return res.render('register', {
        members,
        contests,
        success: null,
        error: `Le membre "${validation.membreNom}" est deja inscrit au concours "${validation.concoursTitre}".`,
        activeTab: 'register'
      });
    }

    await addParticipant({
      contestId: form.contestId,
      memberId: effectiveMemberId,
      complexity: form.complexity,
      executionTime: form.executionTime
    });
    res.render('register', {
      members,
      contests,
      success: `Inscription reussie pour "${validation.membreNom}" au concours "${validation.concoursTitre}" !`,
      error: null,
      activeTab: 'register'
    });
  } catch (err) {
    res.render('register', { members, contests, success: null, error: `Erreur d'inscription : ${err.toString()}`, activeTab: 'register' });
  }
});

module.exports = router;
