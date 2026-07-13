const form = document.getElementById("analysis-form");
const scoreRing = document.getElementById("score-ring");
const scoreValue = document.getElementById("score-value");
const resultTitle = document.getElementById("result-title");
const resultSummary = document.getElementById("result-summary");
const reasonList = document.getElementById("reason-list");

function getScore(data) {
  let score = 0;
  const reasons = [];

  if (data.profilePhoto === "no") {
    score += 18;
    reasons.push("No profile photo reduces trust and looks less authentic.");
  } else {
    score -= 4;
  }

  if (data.bio === "no") {
    score += 10;
    reasons.push("A missing bio often signals low profile completeness.");
  } else {
    score -= 4;
  }

  if (data.fullName === "no") {
    score += 10;
    reasons.push("No visible full name can be a weak identity signal.");
  } else {
    score -= 4;
  }

  if (data.website === "no") {
    score += 8;
    reasons.push("Lack of a profile link suggests less social proof.");
  } else {
    score -= 3;
  }

  if (data.usernameStyle === "number-heavy" || data.usernameStyle === "random") {
    score += 14;
    reasons.push("The username uses a pattern commonly associated with mass-created profiles.");
  } else {
    score -= 5;
  }

  const followerRatio = data.followers / Math.max(1, data.following);
  if (followerRatio > 10) {
    score += 14;
    reasons.push("A very high follower-to-following ratio can look suspicious.");
  } else if (followerRatio < 0.8) {
    score += 12;
    reasons.push("An unusually low follower ratio is another warning sign.");
  } else {
    score -= 4;
  }

  if (data.posts < 8) {
    score += 10;
    reasons.push("Very few posts may reflect a low-quality or newly created profile.");
  } else if (data.posts > 40) {
    score -= 6;
  }

  const engagementRate = data.likes / Math.max(1, data.posts);
  const commentRate = data.comments / Math.max(1, data.posts);
  if (engagementRate < 20 && commentRate < 3) {
    score += 18;
    reasons.push("Low likes and comments suggest weak engagement quality.");
  } else if (engagementRate > 80 && commentRate > 8) {
    score -= 6;
  } else if (engagementRate < 50) {
    score += 5;
  }

  if (data.verified === "yes") {
    score -= 16;
  } else {
    score += 7;
    reasons.push("The account is not verified, which reduces credibility.");
  }

  if (data.activity > 30) {
    score += 14;
    reasons.push("The profile has been inactive for a long time.");
  } else if (data.activity <= 7) {
    score -= 6;
  }

  if (data.ageMonths < 6) {
    score += 8;
    reasons.push("A very new account can be more risky than an older one.");
  } else if (data.ageMonths > 24) {
    score -= 4;
  }

  if (data.privacy === "private") {
    score += 5;
    reasons.push("Private accounts are not always suspicious, but they can hide stronger social signals.");
  } else {
    score -= 2;
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  return { normalizedScore, reasons };
}

function getState(score) {
  if (score >= 75) {
    return {
      title: "Likely fake",
      summary: "This profile shows multiple strong warning signals and should be reviewed carefully.",
      color: "#ff5f7a"
    };
  }

  if (score >= 45) {
    return {
      title: "Needs review",
      summary: "The account has mixed signals, so a closer look is recommended.",
      color: "#ffbf47"
    };
  }

  return {
    title: "Looks credible",
    summary: "This profile appears reasonably authentic based on the signals provided.",
    color: "#2ecf7a"
  };
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = {
    profilePhoto: formData.get("profilePhoto") || document.getElementById("profilePhoto").value,
    bio: formData.get("bio") || document.getElementById("bio").value,
    fullName: formData.get("fullName") || document.getElementById("fullName").value,
    website: formData.get("website") || document.getElementById("website").value,
    usernameStyle: formData.get("usernameStyle") || document.getElementById("usernameStyle").value,
    followers: Number(document.getElementById("followers").value),
    following: Number(document.getElementById("following").value),
    posts: Number(document.getElementById("posts").value),
    likes: Number(document.getElementById("likes").value),
    comments: Number(document.getElementById("comments").value),
    verified: formData.get("verified") || document.getElementById("verified").value,
    activity: Number(document.getElementById("activity").value),
    ageMonths: Number(document.getElementById("ageMonths").value),
    privacy: formData.get("privacy") || document.getElementById("privacy").value
  };

  const { normalizedScore, reasons } = getScore(data);
  const state = getState(normalizedScore);

  scoreValue.textContent = `${normalizedScore}%`;
  resultTitle.textContent = state.title;
  resultSummary.textContent = state.summary;
  scoreRing.style.background = `conic-gradient(${state.color} 0 ${normalizedScore * 3.6}deg, rgba(255,255,255,0.12) ${normalizedScore * 3.6}deg 360deg)`;

  reasonList.innerHTML = "";
  const displayReasons = reasons.slice(0, 4);
  displayReasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    reasonList.appendChild(item);
  });
});
