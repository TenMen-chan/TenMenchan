const characters = [
  {
    name: "山本ディレッタント",
    kana: "YAMAMOTO DILETTANTE",
    role: "サブカル批評家気取りクソ面倒潔癖症委員長",
    image: "assets/yamamoto.png",
    background: "assets/yamamoto-bg.webp",
    voices: ["assets/yamamoto-1.m4a", "assets/yamamoto-2.m4a", "assets/yamamoto-3.m4a"],
    voiceVolumes: [1, 1, 1],
    lead: "都立高校に通う鬼っ子。片親のうえ姉と妹と弟がいる。他人に厳しい。",
    facts: [["趣味", "読書、節約"]],
    ability: [["運動", "C"], ["自信", "D"], ["社交", "D"], ["知識", "B"], ["気力", "B"]]
  },
  {
    name: "テンメンちゃん",
    kana: "TENMEN-CHAN",
    role: "激カワあざとすぎ住所不定ジャリガキ",
    image: "assets/tenmen.png",
    background: "assets/tenmen-bg.webp",
    voices: ["assets/tenmen-1.m4a", "assets/tenmen-2.m4a", "assets/tenmen-3.m4a"],
    voiceVolumes: [1, 1, 0.72],
    lead: "中央線沿線によく住んでいる妖精。ノリ１００％で生きている。脊髄反射的な謎言語で話す。",
    facts: [["趣味", "Youtube、散歩、ゲーム"]],
    ability: [["運動", "B"], ["自信", "B"], ["社交", "B"], ["知識", "D"], ["気力", "A"]]
  }
];

const theatre = document.querySelector("#theatre");
const cast = document.querySelector("#cast");
const focusCamera = document.querySelector("#focusCamera");
const characterBackdrop = document.querySelector("#characterBackdrop");
const profile = document.querySelector("#profile");
const profileVoices = document.querySelector("#profileVoices");
const abilityChart = document.querySelector("#abilityChart");
const openButton = document.querySelector("#openButton");
const closeProfile = document.querySelector("#closeProfile");
const resetStage = document.querySelector("#resetStage");
const prevCharacter = document.querySelector("#prevCharacter");
const nextCharacter = document.querySelector("#nextCharacter");
let currentCharacter = 0;
let profileTransitioning = false;
let profileTransitionId = 0;
let profileHideTimer;
let soundSequenceEnabled = false;
let soundFadeFrame = null;
const characterMotionClasses = [
  "motion-tenmen-hop",
  "motion-tenmen-hop-fast",
  "motion-tenmen-spin",
  "motion-tenmen-spin-fast",
  "motion-tenmen-step",
  "motion-tenmen-step-fast",
  "motion-tenmen-flip",
  "motion-tenmen-flip-fast",
  "motion-yamamoto-stretch",
  "motion-yamamoto-breathe"
];
let characterMotionTimer = null;
let characterMotionGeneration = 0;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clearCharacterMotion() {
  characterMotionGeneration += 1;
  window.clearTimeout(characterMotionTimer);
  characterMotionTimer = null;
  cast.querySelectorAll(".figure-motion").forEach(figure => {
    figure.classList.remove(...characterMotionClasses);
  });
}

function startCharacterMotion(index, context, initialDelay) {
  clearCharacterMotion();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const generation = characterMotionGeneration;
  const isTenmen = index === 1;
  const motions = isTenmen
    ? [
        "motion-tenmen-hop", "motion-tenmen-hop-fast",
        "motion-tenmen-spin", "motion-tenmen-spin-fast",
        "motion-tenmen-step", "motion-tenmen-step-fast",
        "motion-tenmen-flip", "motion-tenmen-flip-fast"
      ]
    : ["motion-yamamoto-breathe", "motion-yamamoto-breathe", "motion-yamamoto-stretch"];

  const contextIsActive = () => {
    if (generation !== characterMotionGeneration) return false;
    if (context === "stage") {
      return theatre.classList.contains("is-open") &&
        !theatre.classList.contains("is-profile") &&
        !theatre.classList.contains("is-profile-closing");
    }
    return theatre.classList.contains("is-profile") && !profile.hidden && currentCharacter === index;
  };

  const scheduleNext = delay => {
    characterMotionTimer = window.setTimeout(runMotion, delay);
  };

  const runMotion = () => {
    if (!contextIsActive()) return;
    const figure = cast.querySelector(`[data-character="${index}"] .figure-motion`);
    if (!figure) return;
    const motion = motions[Math.floor(Math.random() * motions.length)];
    figure.classList.remove(...characterMotionClasses);
    void figure.offsetWidth;
    figure.classList.add(motion);
    characterMotionTimer = window.setTimeout(() => {
      if (generation !== characterMotionGeneration) return;
      figure.classList.remove(motion);
      if (!contextIsActive()) return;

      if (isTenmen) {
        const takesABreak = Math.random() < .22;
        scheduleNext(takesABreak ? randomBetween(1800, 4500) : 80);
      } else {
        scheduleNext(randomBetween(5000, 10000));
      }
    }, 5000);
  };

  scheduleNext(initialDelay);
}

function openCurtain() {
  theatre.classList.add("is-open");
  cast.setAttribute("aria-hidden", "false");
  const focusDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 4700;
  window.setTimeout(() => cast.querySelector("button")?.focus({ preventScroll: true }), focusDelay);
  startCharacterMotion(1, "stage", 2050);
}

function populateProfile(index) {
  stopProfileVoices();
  currentCharacter = (index + characters.length) % characters.length;
  const character = characters[currentCharacter];
  profile.classList.toggle("profile--yamamoto", currentCharacter === 0);
  profile.classList.toggle("profile--tenmen", currentCharacter === 1);
  document.querySelector("#profileImage").src = character.image;
  document.querySelector("#profileImage").alt = character.name;
  characterBackdrop.style.setProperty("--character-bg", `url("${character.background}")`);
  document.querySelector("#profileRole").textContent = character.role;
  document.querySelector("#profileName").textContent = character.name;
  document.querySelector("#profileKana").textContent = character.kana;
  document.querySelector("#profileLead").textContent = character.lead;
  profileVoices.innerHTML = character.voices.map((source, voiceIndex) => `
    <div class="voice-player">
      <button class="voice-button" type="button" aria-pressed="false" aria-label="${character.name}のサウンド${voiceIndex + 1}を再生">
        <span class="voice-button__icon" aria-hidden="true">▶</span>
        <span class="voice-button__label">SOUND ${String(voiceIndex + 1).padStart(2, "0")}</span>
        <span class="voice-button__state">再生</span>
      </button>
      <audio preload="metadata" src="${source}" data-volume="${character.voiceVolumes[voiceIndex] ?? 1}"></audio>
    </div>`).join("");
  document.querySelector("#profileFacts").innerHTML = character.facts
    .map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`)
    .join("");
  renderAbilityChart(character);
}

function renderAbilityChart(character) {
  const centerX = 150;
  const centerY = 138;
  const maxRadius = 72;
  const labelRadius = 94;
  const gradeScale = { A: 1, B: 0.8, C: 0.6, D: 0.4 };
  const pointAt = (index, radius) => {
    const angle = (-90 + index * 72) * Math.PI / 180;
    return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
  };
  const points = radius => character.ability
    .map((_, index) => pointAt(index, radius).map(value => value.toFixed(1)).join(","))
    .join(" ");
  const valuePoints = character.ability
    .map(([, grade], index) => pointAt(index, maxRadius * gradeScale[grade]).map(value => value.toFixed(1)).join(","))
    .join(" ");
  const axes = character.ability
    .map((_, index) => {
      const [x, y] = pointAt(index, maxRadius);
      return `<line x1="${centerX}" y1="${centerY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
    }).join("");
  const labels = character.ability
    .map(([label, grade], index) => {
      const [x, y] = pointAt(index, labelRadius);
      return `<text x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}"><tspan x="${x.toFixed(1)}">${label}</tspan><tspan class="ability__grade" x="${x.toFixed(1)}" dy="15">${grade}</tspan></text>`;
    }).join("");
  const summary = character.ability.map(([label, grade]) => `${label}${grade}`).join("、");

  abilityChart.innerHTML = `
    <svg viewBox="0 0 300 276" role="img" aria-label="${character.name}の能力値。${summary}">
      <circle class="ability__circle" cx="${centerX}" cy="${centerY}" r="112" />
      <g class="ability__grid">
        ${[0.25, 0.5, 0.75, 1].map(level => `<polygon points="${points(maxRadius * level)}" />`).join("")}
        ${axes}
      </g>
      <polygon class="ability__value" points="${valuePoints}" />
      <g class="ability__labels">${labels}</g>
    </svg>`;
}

function stopProfileVoices() {
  soundSequenceEnabled = false;
  cancelSoundFade();
  profileVoices.querySelectorAll("audio").forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = Number(audio.dataset.volume ?? 1);
  });
  profileVoices.querySelectorAll(".voice-button").forEach(button => {
    button.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    button.querySelector(".voice-button__icon").textContent = "▶";
    button.querySelector(".voice-button__state").textContent = "再生";
  });
}

function cancelSoundFade() {
  if (soundFadeFrame !== null) {
    window.cancelAnimationFrame(soundFadeFrame);
    soundFadeFrame = null;
  }
}

function fadeAudioIn(audio, targetVolume, duration = 1100) {
  cancelSoundFade();
  const startedAt = performance.now();
  audio.volume = 0;

  const raiseVolume = now => {
    if (audio.paused) {
      soundFadeFrame = null;
      return;
    }

    const progress = Math.min(1, (now - startedAt) / duration);
    audio.volume = targetVolume * progress;
    if (progress < 1) {
      soundFadeFrame = window.requestAnimationFrame(raiseVolume);
    } else {
      soundFadeFrame = null;
    }
  };

  soundFadeFrame = window.requestAnimationFrame(raiseVolume);
}

function setVoiceButtonState(button, playing) {
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-pressed", String(playing));
  button.querySelector(".voice-button__icon").textContent = playing ? "Ⅱ" : "▶";
  button.querySelector(".voice-button__state").textContent = playing ? "停止" : "再生";
}

function playProfileSound(soundIndex, restart = false, fadeIn = false) {
  const players = [...profileVoices.querySelectorAll(".voice-player")];
  const targetPlayer = players[soundIndex];
  if (!targetPlayer) return;

  soundSequenceEnabled = true;
  cancelSoundFade();
  const targetAudio = targetPlayer.querySelector("audio");
  const targetButton = targetPlayer.querySelector(".voice-button");
  players.forEach(player => {
    const audio = player.querySelector("audio");
    const button = player.querySelector(".voice-button");
    if (audio !== targetAudio) {
      audio.pause();
      audio.currentTime = 0;
      setVoiceButtonState(button, false);
    }
  });

  if (restart) targetAudio.currentTime = 0;
  const targetVolume = Number(targetAudio.dataset.volume ?? 1);
  targetAudio.volume = fadeIn ? 0 : targetVolume;
  targetAudio.play().then(() => {
    setVoiceButtonState(targetButton, true);
    if (fadeIn) fadeAudioIn(targetAudio, targetVolume);
  }).catch(() => {
    soundSequenceEnabled = false;
    setVoiceButtonState(targetButton, false);
    targetButton.querySelector(".voice-button__state").textContent = "押して再生";
  });
}

function revealCharacterBackdrop() {
  characterBackdrop.classList.remove("is-revealing");
  void characterBackdrop.offsetWidth;
  characterBackdrop.classList.add("is-revealing");
}

function focusCharacter(index) {
  const member = cast.querySelector(`[data-character="${index}"]`);
  if (!member) return null;

  cast.querySelectorAll(".cast-member").forEach(element => {
    element.classList.toggle("is-selected", element === member);
  });

  const focusX = ((cast.offsetLeft + member.offsetLeft + member.offsetWidth / 2) / focusCamera.clientWidth) * 100;
  const focusY = ((cast.offsetTop + member.offsetTop + member.offsetHeight * .96) / focusCamera.clientHeight) * 100;
  const tenmenCameraOffset = index === 1 ? (focusCamera.clientWidth <= 720 ? 10 : 14) : 0;
  focusCamera.style.setProperty("--focus-x", `${Math.max(8, Math.min(92, focusX + tenmenCameraOffset))}%`);
  focusCamera.style.setProperty("--focus-y", `${Math.max(12, Math.min(90, focusY))}%`);
  return member;
}

function openProfile(member, index) {
  if (profileTransitioning) return;
  clearCharacterMotion();
  window.clearTimeout(profileHideTimer);
  const transitionId = ++profileTransitionId;
  profileTransitioning = true;
  theatre.classList.remove("is-profile-closing");
  populateProfile(index);
  playProfileSound(0, true, true);
  focusCharacter(currentCharacter);
  profile.hidden = false;
  profile.classList.remove("is-visible", "is-closing");
  profile.classList.add("is-preparing");
  cast.setAttribute("aria-hidden", "true");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  requestAnimationFrame(() => {
    theatre.classList.add("is-profile");
    revealCharacterBackdrop();
    profile.classList.remove("is-preparing");
    profile.classList.add("is-arriving");

    const travelTime = reducedMotion ? 30 : 980;
    window.setTimeout(() => {
      if (transitionId !== profileTransitionId) return;
      profile.classList.remove("is-arriving");
      profile.classList.add("is-visible");
      profileTransitioning = false;
      startCharacterMotion(currentCharacter, "profile", currentCharacter === 1 ? 80 : randomBetween(5000, 10000));
      closeProfile.focus({ preventScroll: true });
    }, travelTime);
  });
}

function renderProfile(index) {
  if (profileTransitioning) return;
  clearCharacterMotion();
  const transitionId = ++profileTransitionId;
  profileTransitioning = true;
  profile.classList.remove("is-visible");
  profile.classList.add("is-arriving");
  populateProfile(index);
  playProfileSound(0, true, true);
  focusCharacter(currentCharacter);
  revealCharacterBackdrop();
  profile.hidden = false;
  cast.setAttribute("aria-hidden", "true");
  const switchTime = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 720;
  window.setTimeout(() => {
    if (transitionId !== profileTransitionId) return;
    profile.classList.remove("is-arriving");
    profile.classList.add("is-visible");
    profileTransitioning = false;
    startCharacterMotion(currentCharacter, "profile", currentCharacter === 1 ? 80 : randomBetween(5000, 10000));
    closeProfile.focus({ preventScroll: true });
  }, switchTime);
}

function hideProfile() {
  if (profileTransitioning) return;
  clearCharacterMotion();
  stopProfileVoices();
  const transitionId = ++profileTransitionId;
  profileTransitioning = true;
  profile.classList.remove("is-visible", "is-arriving", "is-preparing");
  profile.classList.add("is-closing");
  characterBackdrop.classList.remove("is-revealing");
  theatre.classList.remove("is-profile");
  theatre.classList.add("is-profile-closing");
  cast.setAttribute("aria-hidden", "false");
  const returningMember = cast.querySelector(`[data-character="${currentCharacter}"]`);
  profileHideTimer = window.setTimeout(() => {
    if (transitionId !== profileTransitionId) return;
    profile.hidden = true;
    profile.classList.remove("is-closing");
    theatre.classList.remove("is-profile-closing");
    cast.querySelectorAll(".cast-member").forEach(element => element.classList.remove("is-selected"));
    profileTransitioning = false;
    startCharacterMotion(1, "stage", 80);
    returningMember?.focus({ preventScroll: true });
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 20 : 980);
}

function closeCurtain() {
  profileTransitionId += 1;
  window.clearTimeout(profileHideTimer);
  profileTransitioning = false;
  clearCharacterMotion();
  stopProfileVoices();
  profile.hidden = true;
  profile.classList.remove("is-visible", "is-arriving", "is-preparing", "is-closing");
  characterBackdrop.classList.remove("is-revealing");
  theatre.classList.remove("is-profile", "is-profile-closing");
  cast.querySelectorAll(".cast-member").forEach(element => element.classList.remove("is-selected"));
  focusCamera.style.removeProperty("--focus-x");
  focusCamera.style.removeProperty("--focus-y");
  theatre.classList.remove("is-open");
  cast.setAttribute("aria-hidden", "true");
  openButton.focus({ preventScroll: true });
}

openButton.addEventListener("click", openCurtain);
cast.addEventListener("click", event => {
  const member = event.target.closest("[data-character]");
  if (member) openProfile(member, Number(member.dataset.character));
});
closeProfile.addEventListener("click", hideProfile);
resetStage.addEventListener("click", closeCurtain);
prevCharacter.addEventListener("click", () => renderProfile(currentCharacter - 1));
nextCharacter.addEventListener("click", () => renderProfile(currentCharacter + 1));

profileVoices.addEventListener("click", event => {
  const button = event.target.closest(".voice-button");
  if (!button) return;
  const player = button.parentElement;
  const audio = player.querySelector("audio");

  if (!audio.paused) {
    soundSequenceEnabled = false;
    cancelSoundFade();
    audio.pause();
    audio.volume = Number(audio.dataset.volume ?? 1);
    setVoiceButtonState(button, false);
    return;
  }

  const soundIndex = [...profileVoices.querySelectorAll(".voice-player")].indexOf(player);
  playProfileSound(soundIndex);
});

profileVoices.addEventListener("ended", event => {
  const players = [...profileVoices.querySelectorAll(".voice-player")];
  const player = event.target.parentElement;
  const button = event.target.parentElement.querySelector(".voice-button");
  event.target.currentTime = 0;
  event.target.volume = Number(event.target.dataset.volume ?? 1);
  setVoiceButtonState(button, false);
  if (soundSequenceEnabled && players.length > 0) {
    const soundIndex = players.indexOf(player);
    playProfileSound((soundIndex + 1) % players.length, true, true);
  }
}, true);

document.addEventListener("keydown", event => {
  if (profile.hidden || profileTransitioning) return;
  if (event.key === "Escape") hideProfile();
  if (event.key === "ArrowLeft") renderProfile(currentCharacter - 1);
  if (event.key === "ArrowRight") renderProfile(currentCharacter + 1);
});
